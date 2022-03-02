import axios from 'axios'
import uniqid from 'uniqid'
import retry from 'async-retry'
import AsyncLock from 'async-lock'
import { Task } from '../../src/Task'

export interface JobResponse {
  output: any,
  children?: any[]
}

export default abstract class Worker {
  // A unique id for the worker
  id: string

  // What channel the worker operates in
  channel: string

  // Worker's name
  name: string

  // Crew api url and credentials
  apiBaseUrl = process.env.CREW_API_BASE_URL || 'http://localhost:3000/'

  // The currently assigned task
  task: Task | null

  // Subclasses should set this to the desired delay when they encounter rate limit responses or errors
  pauseWorkgroupSeconds = 0

  // Goes with setInterval to poll for new tasks
  workInterval: NodeJS.Timeout | null = null

  // This lock is used to ensure that the doWork function only has one concurrent execution
  lock = new AsyncLock({maxPending: 1})
  
  // True when the worker has been asked to shutdown and no new tasks should be acquired
  shuttingDown = false
  
  // How long should the worker wait before polling for new tasks
  workIntervalDelay = parseInt(process.env.CREW_WORK_INTERVAL_IN_MILLISECONDS || '15000')

  // When true the worker will look for a new task immediately after finishing a task
  // This helps drain work queues faster but may not be desirable in rate limited workflows
  workIntervalRestart = (process.env.CREW_WORK_INTERVAL_RESTART || 'yes') === 'yes'

  constructor() {
    this.task = null
    this.id = uniqid()
  }

  // WorkerGroup calls this method to start the worker
  public async startWork() {
    this.shuttingDown = false
    // Run immediately
    let restart = true
    while(restart && !this.shuttingDown) {
      try {
        restart = await this.doWork()
      } catch (error) {
        console.error('doWork (initial) error', error)
        restart = false
      }
    }

    // Check for new work at a regular interval
    this.workInterval = setInterval(async () => {
      if (this.lock.isBusy()) {
        return
      }
      restart = true
      while(restart && !this.shuttingDown) {
        try {
          restart = await this.doWork()
        } catch (error) {
          console.error('doWork (interval) error', error)
          restart = false
        }
      }
    }, this.workIntervalDelay)
  }

  // WorkerGroup calls this method to stop the worker (usually due to SIGINT or SIGTERM)
  public stopWork() {
    this.shuttingDown = true
    console.log(`~~ ${this.channel} (${this.id}) stopWork`)
    // stop looking for new tasks:
    if (this.workInterval) {
      clearInterval(this.workInterval)
    }
  }

  // Subclasses implement this method to cleanup any resources they use (database connections)
  abstract cleanup() : Promise<void>

  // Subclasses implement this method to do their thing
  abstract executeJob(data : any, parents: any[]) : Promise<JobResponse>

  // Let worker group know if we are healthy or not
  abstract isHealthy() : Promise<boolean>

  // Primary workflow implementation
  private async doWork() : Promise<boolean> {
    try {
      // Prevent concurrency
      const restart = await this.lock.acquire(this.id, async () => {
        this.task = null
        try {
          console.log(`~~ ${this.channel} (${this.id}) asking for task`)
          // Ask the api for a new task in my channel
          const acquireResponse = await axios.post(this.apiBaseUrl + `api/v1/channel/${this.channel}/acquire`, {
            workerId: this.id
          })
          if (acquireResponse.data.task) {
            this.pauseWorkgroupSeconds = 0
            this.task = acquireResponse.data.task as Task
            if (this.task && this.task._id) {
              console.log(`~~ ${this.channel} (${this.id}) acquired task ${this.task._id}`)
              // If I got a task, execute it
              const executeResponse = await this.executeJob(acquireResponse.data.task.input, acquireResponse.data.parents)

              // Once the work is completed, let the API know in a resilient way
              const restart = await retry(
                async (bail) => {
                  if (this.task && this.task._id) {
                    console.log(`~~ ${this.channel} (${this.id}) complete task ${this.task._id} attempt`)
                    const releaseData : any = {
                      workerId: this.id,
                      output: executeResponse.output || null,
                      children: executeResponse.children || []
                    }
                    if (this.pauseWorkgroupSeconds > 0) {
                      releaseData.workgroupDelayInSeconds = this.pauseWorkgroupSeconds
                    }
                    if (this.task) {
                      await axios.post(this.apiBaseUrl + `api/v1/task/${this.task._id}/release`, releaseData)
                    }
                    console.log(`~~ ${this.channel} (${this.id}) complete task ${this.task._id} success`)
                    // Signal that we should immediately check for new work
                    return this.workIntervalRestart
                  }
                  // Something went wrong, don't immediately check for new work
                  return false
                }
              , {
                retries: 3,
                factor: 3,
                minTimeout: 1 * 1000,
                maxTimeout: 10 * 1000,
                randomize: true,
              })
              // Return value tells signals if doWork should be re-run immediately or not 
              return restart
            } else {
              console.log(`~~ ${this.channel} (${this.id}) received null task `)
            }
          }
        } catch (error) {
          // Something went wrong, usually in executeJob
          console.error(error)

          // Let the API know about the error in a resilient way
          await retry(
            async (bail) => {
              if (this.task && this.task._id) {
                console.log(`~~ ${this.channel} (${this.id}) fail task ${this.task._id} attempt`)
                const releaseData : any = {
                  workerId: this.id,
                  error: error instanceof Error ? error.message : error + ''
                }
                if (this.pauseWorkgroupSeconds > 0) {
                  releaseData.workgroupDelayInSeconds = this.pauseWorkgroupSeconds
                }
                await axios.post(this.apiBaseUrl + `api/v1/task/${this.task._id}/release`, releaseData)
                console.log(`~~ ${this.channel} (${this.id}) fail task ${this.task._id} success`)
              }
            }
          , {
            retries: 3,
            factor: 3,
            minTimeout: 1 * 1000,
            maxTimeout: 10 * 1000,
            randomize: true,
          })
          return false
        } finally {
          this.task = null
        }
        return false
      })
      return restart
    } catch (lockError) {
      console.warn('lock error', lockError)
      return false
    }
  }
}

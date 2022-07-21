import express from 'express'
import TaskResponse from './TaskResponse'
import HttpWorkerGroup from './HttpWorkerGroup'

export default abstract class HttpWorker {
  // What channel the worker operates in
  channel: string

  // Worker's name
  name: string

  // Subclasses should set this to the desired delay when they encounter rate limit responses or errors
  pauseWorkgroupSeconds = 0
  
  // True when the worker has been asked to shutdown and no new tasks should be acquired
  shuttingDown = false

  // Provide workers access to their workgroup so that they can access express
  group: HttpWorkerGroup | null = null

  // Subclasses override this method to initialize any resources prior to work starting (add express routes in worker group)
  async prepare() : Promise<void> {
    return Promise.resolve()
  }

  async serve() {
    this.group?.server?.app.post('/execute/' + this.channel, async (req: express.Request, res: express.Response) => {
      this.pauseWorkgroupSeconds = 0
      try {
        const input = req.body.input
        const parents = req.body.parents
        const executeResponse : any = await this.executeTask(input, parents)
        if (this.pauseWorkgroupSeconds > 0) {
          executeResponse.workgroupDelayInSeconds = this.pauseWorkgroupSeconds
        }
        res.send(executeResponse)
      } catch (err) {
        let response : any = {}
        if (err instanceof Error) {
          response = {error: err.message}
        } else {
          response = {error: err}
        }
        if (this.pauseWorkgroupSeconds > 0) {
          response.workgroupDelayInSeconds = this.pauseWorkgroupSeconds
        }
        res.send(response)
      }
    })
  }

  // Subclasses override this method to cleanup any resources they use (database connections)
  async cleanup() : Promise<void> {
    return Promise.resolve()
  }

  // Subclasses implement this method to do their thing
  abstract executeTask(data : any, parents: any[]) : Promise<TaskResponse>

  // Sublclasses override this method to let worker group know if we are healthy or not
  isHealthy() : Promise<boolean> {
    return Promise.resolve(true)
  }
}

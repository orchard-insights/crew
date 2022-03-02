import Worker from './Worker'
import WorkerServer from './WorkerServer'
import express from 'express'
import http from 'http'

// "this" safe function for checking worker shutdown status
async function checkWorkersReadyForExit(app: WorkerServer | null, workers: Worker[], killTimeout: NodeJS.Timeout | null) {
  let doExit = true
  for (const worker of workers) {
    // Make sure all workers are no longer busy
    console.log(`Shutdown worker ${worker.name} (${worker.id}) isBusy = ${worker.lock.isBusy()}`)
    if (worker.lock.isBusy()) {
      doExit = false
    }
  }
  if (doExit) {
    // Once all workers are no longer busy, ask each to cleanup their resources
    for (const worker of workers) {
      console.log(`Shutdown cleanup worker ${worker.name} (${worker.id})`)
      await worker.cleanup()
    }
    // Stop express
    if (app) {
      app.server.close()
    }
    // Prevent the default timeout process.exit interval from running
    if (killTimeout) {
      clearTimeout(killTimeout)
    }
    console.log('Worker cleanup complete - exit!')
    // Shutdown
    process.exit(1)
  } else {
    setTimeout(() => {
      checkWorkersReadyForExit(app, workers, killTimeout)
    }, 5000)
  }
}

export default class WorkerGroup {
  server: WorkerServer | null
  workers: Worker[]
  shuttingDown = false
  killTimeout: NodeJS.Timeout | null = null

  constructor(workers: Worker[]) {
    this.workers = workers

    process.on('SIGTERM', () => {
      console.info('Got SIGTERM. Graceful shutdown start', new Date().toISOString())
      this.startShutdown()
    })
    
    process.on('SIGINT', () => {
      console.info('Got SIGINT. Graceful shutdown start', new Date().toISOString())
      this.startShutdown()
    })

    if (process.env.CREW_WORKER_DISABLE_EXPRESS !== 'yes') {
      this.server = new WorkerServer()
      this.server.app.get(`/healthcheck`, async (req: express.Request, res: express.Response) => {
        let isHealthy = true
        for (const worker of this.workers) {
          const isWorkerHealthy = await worker.isHealthy()
          if (!isWorkerHealthy) {
            isHealthy = false
            break
          }
        }
        if (isHealthy) {
          res.json({healthy: true})
        } else {
          res.status(500).json({healthy: false})
        }
      })
  
      this.server.app.get('/readycheck', async (req: express.Request, res: express.Response) => {
        res.json({ready: true})
      })
  
      this.server.app.get('/', async (req: express.Request, res: express.Response) => {
        const results = []
        for (const worker of this.workers) {
          if (worker.id) {
            results.push({id: worker.id, name: worker.name, channel: worker.channel, working: worker.lock.isBusy()})
          } else {
            results.push({id: null, name: worker.name, channel: worker.channel, working: null})
          }
        }
        res.json(results)
      })
    }

    for (const worker of workers) {
      worker.startWork()
    }
  }

  startShutdown() {
    if (this.shuttingDown) {
      return
    }
    this.shuttingDown = true
    // Ask each worker to gracefully shutdown
    for (const worker of this.workers) {
      worker.stopWork()
    }
  
    // Force process exit after shutdown timeout
    this.killTimeout = setTimeout(() => {
      console.warn('~~ Group graceful shutdown failed - force shutdown!')
      process.exit(1)
    }, (parseInt(process.env.CREW_SHUTDOWN_TIMEOUT_IN_MILLISECONDS || '30000')))

    // Watch workers to see if all ready for exit
    checkWorkersReadyForExit(this.server, this.workers, this.killTimeout)
  }
}

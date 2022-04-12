import Worker from './Worker'
import WorkerServer from './WorkerServer'
import express from 'express'

async function finalizeShutdown(app: WorkerServer | null, workers: Worker[], killTimeout: NodeJS.Timeout | null) {
  // Ask each to worker to cleanup its resources
  for (const worker of workers) {
    console.log(`Shutdown cleanup worker ${worker.name} (${worker.id})`)
    await worker.cleanup()
  }
  // Stop express
  if (app) {
    app.server.close()
  }
  // If necessary, prevent the default timeout process.exit interval from running
  if (killTimeout) {
    clearTimeout(killTimeout)
  }
  console.log('Worker cleanup complete - exit!')
  // Shutdown
  process.exit(1)
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
            results.push({id: worker.id, name: worker.name, channel: worker.channel, working: worker.task ? true : false})
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

  async startShutdown() {
    if (this.shuttingDown) {
      return
    }
    this.shuttingDown = true
    const stopPromises = []
    // Ask each worker to gracefully shutdown
    for (const worker of this.workers) {
      stopPromises.push(worker.stopWork())
    }

    // Set a timeout to force process to exit if workers take too long to shutdown
    this.killTimeout = setTimeout(async () => {
      console.warn('~~ Group graceful shutdown failed - force shutdown!')
      await finalizeShutdown(this.server, this.workers, null)
    }, (parseInt(process.env.CREW_SHUTDOWN_TIMEOUT_IN_MILLISECONDS || '30000')))

    await Promise.all(stopPromises)

    await finalizeShutdown(this.server, this.workers, this.killTimeout)
  }
}

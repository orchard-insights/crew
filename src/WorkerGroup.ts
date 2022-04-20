import Worker from './Worker'
import WorkerServerInterface from './WorkerServerInterface'
import express from 'express'
import _ from 'lodash'

async function finalizeShutdown(app: WorkerServerInterface | null, workers: Worker[], killTimeout: NodeJS.Timeout | null) {
  // Ask each to worker to cleanup its resources
  for (const worker of workers) {
    console.log(`Shutdown cleanup worker ${worker.name} (${worker.id})`)
    await worker.cleanup()
  }
  // Stop express
  if (app && app.closeOnWorkerShutdown) {
    app.server.close(() => {
      console.log('WorkerServer closed.')
    })
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
  server: WorkerServerInterface | null
  workers: Worker[]
  shuttingDown = false
  killTimeout: NodeJS.Timeout | null = null

  constructor(workers: Worker[] = [], workerServer: WorkerServerInterface | null = null) {
    this.workers = workers

    const signals = ['SIGTERM', 'SIGINT']

    if (process.platform === "win32") {
      console.warn('Graceful shutdown for workers is not supported on Windows!')
    }
    for (const signal of signals) {
      process.once(signal, async (signalOrEvent) => {
        console.info('~~ Got ' + signalOrEvent + '. Graceful shutdown started.', new Date().toISOString())
        await this.startShutdown()
      })
    }

    if (workerServer) {
      this.server = workerServer
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
      worker.group = this
      worker.prepare().then(() => {
        worker.startWork()
      })
    }
  }

  addWorker(worker: Worker) {
    worker.group = this
    this.workers.push(worker)
    worker.prepare().then(() => {
      worker.startWork()
    })
  }

  async removeWorker(worker: Worker) {
    await worker.stopWork()
    this.workers = _.without(this.workers, worker)
  }

  async startShutdown() {
    try {
      if (this.shuttingDown) {
        return
      }
      this.shuttingDown = true
      const stopPromises = []

      // Ask each worker to gracefully shutdown
      for (const worker of this.workers) {
        const stopPromise = worker.stopWork()
        console.log('~~ ask stop', worker.name, stopPromise)
        stopPromises.push(stopPromise)
      }

      // Set a timeout to force process to exit if workers take too long to shutdown
      this.killTimeout = setTimeout(async () => {
        console.warn('~~ Group graceful shutdown failed - force shutdown!')
        await finalizeShutdown(this.server, this.workers, null)
      }, (parseInt(process.env.CREW_SHUTDOWN_TIMEOUT_IN_MILLISECONDS || '30000')))

      await Promise.all(stopPromises)
      console.log('~~ All workers stopped.')

      await finalizeShutdown(this.server, this.workers, this.killTimeout)
    } catch (e) {
      console.error('startShutdown failed :', e)
    }
  }
}

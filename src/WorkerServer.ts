import express from 'express'
import cors from 'cors'
import http from 'http'
import WorkerServerInterface from './WorkerServerInterface'

export default class WorkerServer implements WorkerServerInterface {
  app: express.Express
  server: http.Server
  closeOnWorkerShutdown: true
  constructor() {
    // Setup express (with cors and json bodyparser)
    this.app = express()
    this.server = http.createServer(this.app)
    this.app.use(cors())
    this.app.use(express.json())

    const port = parseInt(process.env.CREW_WORKER_PORT || '3002')
    this.app.listen(port, () => console.log(`worker server listening on port ${port}!`))
  }
}

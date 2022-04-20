import express from 'express'
import http from 'http'

export default interface WorkerServerInterface {
  app: express.Express
  server: http.Server
  closeOnWorkerShutdown: boolean
}

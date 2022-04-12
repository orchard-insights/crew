#!/usr/bin/env node
import { program } from 'commander'
import express from 'express'
import http from 'http'
import { crew } from './crew'
import WorkerGroup from './WorkerGroup'
import WorkerA from '../demo/js/WorkerA'
import WorkerB from '../demo/js/WorkerB'
import WorkerC from '../demo/js/WorkerC'

program
  .version('0.0.1')

program.command('start')
  .description('Run crew API')
  .option('-m, --mongodb <uri>', 'Set the MongoDB connection string', 'MEMORY') // , 'mongodb://localhost:27017/orchard-crew?readPreference=primary&ssl=false')
  .option('-p, --port <port>', 'Which port to attach to [3000]', '3000')
  .action((options) => {
    process.env.CREW_MONGO_URI = options.mongodb
    process.env.PORT = options.port

    console.log('Starting server...')

    // Setup express
    const app = express()
    const server = http.createServer(app)

    // Add crew with no auth
    app.use('/', crew({
      server
    }))

    const port = parseInt(process.env.PORT || '3000')
    server.listen(port, () => {
      // tslint:disable-next-line:no-console
      console.log( `Server started on port ${port}` )
    })
  })

program.command('work')
  .description('Run crew demo workers')
  .option('-u, --url <url>', 'Which url should the workers use to access the API [http://localhost:3000/]')
  .action((options) => {
    process.env.CREW_API_BASE_URL = options.url || 'http://localhost:3000/'
    process.env.CREW_WORKER_DISABLE_EXPRESS = 'yes'

    new WorkerGroup([
      new WorkerA(),
      new WorkerB(),
      new WorkerC()
    ])
  })

program.parse(process.argv)

// This file is used for development and as an example of how to embed crew in an existing express application.

// Use .env (for development)
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

import express from 'express'
import http from 'http'
import { crew } from './crew'

// Setup express
const app = express()
const server = http.createServer(app)

// All your other express stuff goes here!
app.use('/', crew({
    server
  })
)

const port = parseInt(process.env.PORT || '3000')
server.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log( `Server started on port ${port}` );
  console.log( `The crew API is available at /ap1/v1' }`)
})

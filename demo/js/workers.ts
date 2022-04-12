// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

import WorkerGroup from '../../src/WorkerGroup'

import WorkerA from './WorkerA'
import WorkerB from './WorkerB'
import WorkerC from './WorkerC'

new WorkerGroup([
  new WorkerA(),
  new WorkerB(),
  new WorkerC()
])

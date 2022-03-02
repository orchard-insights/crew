import express from 'express'
import { Request, Response } from 'express'
import terminus from '@godaddy/terminus'
import { MongoClient, ObjectId } from 'mongodb'
import initDb from './database'
import { TaskGroup } from './TaskGroup'
import { Task } from './Task'
import cron from 'node-cron'
import { Socket, Server } from 'socket.io'
import http from 'http'
import cors from 'cors'
import CrewDatabase from './CrewDatabase'

interface CrewOptions {
  server: http.Server,
  io?: Server,
  authenticateSocket?: (socket: Socket, message: any) => boolean
}

export let io : Server | null = null

export default function (options: CrewOptions) : express.Router {
  // Crew uses its own router
  const router = express.Router()
  router.use(cors())
  router.use(express.json({ limit: '10MB'}))

  // Create websocket server if one wasn't provided
  if (!options.io) {
    io = new Server(options.server, {
      cors: {
        origin: '*',
        methods: ["GET", "POST"]
      }
    })
    options.io = io
  }

  options.io?.on('connection', (socket: Socket) => {
    socket.on('watchTaskGroup', async (msg) => {
      // Authenticate socket access
      let socketAuthenticated = false
      if (options.authenticateSocket) {
        socketAuthenticated = await options.authenticateSocket(socket, msg)
      } else {
        socketAuthenticated = true
      }
      if (socketAuthenticated) {
        socket.join(msg.taskGroupId)
      }
    })
    socket.on('unwatchTaskGroup', (msg) => {
      socket.leave(msg.taskGroupId)
    })
    // socket.on('disconnect', () => {    
    //   console.log('socket disconnected')
    // })
  })

  // Keep track of mongo connection status (for healthcheck)
  let databaseConnected = false

  // This function helps return nice error messages for all our async route handlers
  function unhandledExceptionsHandler(asyncFunction: (req: express.Request, res: express.Response) => void) {
    return async (req: express.Request, res: express.Response) => {
      try {
        await asyncFunction(req, res)
      }
      catch (error) {
        console.error(error)
        if (error instanceof Error) {
          res.status(500).json({ message: error.message })
        } else {
          res.status(500).json({ message: error + '' })
        }
      }
    }
  }

  let client : MongoClient | null = null

  // Connect to mongdb and then setup the routes
  initDb().then((database: CrewDatabase) => {
    databaseConnected = true

    client = database.client

    // Watch for database connection loss
    database.client.on('close', () => {
      databaseConnected = false
      console.log('Database connection closed!')
    })

    database.client.on('topologyClosed', () => {
      databaseConnected = false
      console.log('Database connection closed!')
    })

    // Home
    router.get('/', unhandledExceptionsHandler(
      async (req, res) => {
      res.send('Hi!  I\'m Crew.  You\'ll need to use my API or my UI to see what is going on.')
    }))

    // Healthcheck
    router.get('/healthz', unhandledExceptionsHandler(
      async (req, res) => {
      await database.client.db().admin().listDatabases()
      if (!databaseConnected) {
        res.status(500)
      }
      res.json({ healthy: databaseConnected })
    }))

    router.get('/api/v1/task_groups', unhandledExceptionsHandler(
      async (req, res) => {
        const limit = parseInt(req.query.limit as string || '50')
        const skip = parseInt(req.query.skip as string || '0')
        const groups = await TaskGroup.findAll(limit, skip)
        res.json(groups)
      }
    ))

    router.get('/api/v1/task_groups/count', unhandledExceptionsHandler(
      async (req, res) => {
        const count = await TaskGroup.countAll()
        res.json({ count })
      }
    ))

    router.get('/api/v1/task_group/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const group = await TaskGroup.findById(new ObjectId(req.params.id))
        if (group) {
          res.json(group)
        } else {
          res.status(404).json({ message: `TaskGroup with id ${req.params.id} not found!` })
        }
      }
    ))

    router.get('/api/v1/task/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const task = await Task.findById(new ObjectId(req.params.id))
        if (task) {
          res.json(task)
        } else {
          res.status(404).json({ message: `Task with id ${req.params.id} not found!` })
        }
      }
    ))

    router.get('/api/v1/task_group/:id/tasks', unhandledExceptionsHandler(
      async (req, res) => {
        const limit = parseInt(req.query.limit as string || '-1')
        const skip = parseInt(req.query.skip as string || '0')
        const tasks = await Task.findAllInGroup(new ObjectId(req.params.id), limit, skip)
        res.json(tasks)
      }
    ))

    router.get('/api/v1/channel/:id/tasks', unhandledExceptionsHandler(
      async (req, res) => {
        const limit = parseInt(req.query.limit as string || '50')
        const skip = parseInt(req.query.skip as string || '0')
        const tasks = await Task.findAllInChannel(limit, skip, req.params.id as string)
        res.json(tasks)
      }
    ))

    router.get('/api/v1/channels', unhandledExceptionsHandler(
      async (req, res) => {
        const channelStats = await Task.getChannels()
        res.json(channelStats)
      }
    ))

    router.post('/api/v1/task_groups', unhandledExceptionsHandler(
      async (req, res) => {
        const group = await TaskGroup.fromData(req.body)
        res.json(group)
      }
    ))

    router.post('/api/v1/task_group/:id/tasks', unhandledExceptionsHandler(
      async (req, res) => {
        const task = await Task.fromData(new ObjectId(req.params.id), req.body)
        res.json(task)
      }
    ))

    router.delete('/api/v1/task_group/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const deleteResult = await TaskGroup.deleteById(new ObjectId(req.params.id))
        res.json(deleteResult)
      }
    ))

    router.delete('/api/v1/task/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const deleteResult = await Task.deleteById(new ObjectId(req.params.id))
        res.json(deleteResult)
      }
    ))

    router.post('/api/v1/task_group/:id/reset', unhandledExceptionsHandler(
      async (req, res) => {
        const resetResult = await TaskGroup.resetById(new ObjectId(req.params.id))
        res.json(resetResult)
      }
    ))

    router.post('/api/v1/task_group/:id/retry', unhandledExceptionsHandler(
      async (req, res) => {
        const remainingAttempts = parseInt(req.body.remainingAttempts || '2')
        const retryResult = await TaskGroup.retryById(new ObjectId(req.params.id), remainingAttempts)
        res.json(retryResult)
      }
    ))

    router.post('/api/v1/task_group/:id/pause', unhandledExceptionsHandler(
      async (req, res) => {
        const resetResult = await TaskGroup.syncPauseById(new ObjectId(req.params.id), true)
        res.json(resetResult)
      }
    ))

    router.post('/api/v1/task_group/:id/resume', unhandledExceptionsHandler(
      async (req, res) => {
        const resetResult = await TaskGroup.syncPauseById(new ObjectId(req.params.id), false)
        res.json(resetResult)
      }
    ))

    router.post('/api/v1/task/:id/reset', unhandledExceptionsHandler(
      async (req, res) => {
        const remainingAttempts = parseInt(req.body.remainingAttempts || '2')
        const resetResult = await Task.resetById(new ObjectId(req.params.id), remainingAttempts)
        res.json(resetResult)
      }
    ))

    router.post('/api/v1/task/:id/retry', unhandledExceptionsHandler(
      async (req, res) => {
        const remainingAttempts = parseInt(req.body.remainingAttempts || '2')
        const resetResult = await Task.retryById(new ObjectId(req.params.id), remainingAttempts)
        res.json(resetResult)
      }
    ))

    router.post('/api/v1/task/:id/pluck', unhandledExceptionsHandler(
      async (req, res) => {
        const task = await Task.pluckById(new ObjectId(req.params.id))
        res.json(task)
      }
    ))

    router.put('/api/v1/task/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const task = await Task.updateById(new ObjectId(req.params.id), req.body)
        res.json(task)
      }
    ))

    router.put('/api/v1/task_group/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const group = await TaskGroup.updateById(new ObjectId(req.params.id), req.body)
        res.json(group)
      }
    ))

    router.post('/api/v1/channel/:id/acquire', unhandledExceptionsHandler(
      async (req, res) => {
        if (!req.body.workerId) {
          throw new Error('workerId is required!')
        }
        const workerId = req.body.workerId
        const task = await Task.acquireInChannel(req.params.id, workerId)
        if (task) {
          // Collect parent's channel, input, and output
          const parents = await Task.getParentsData(task)
          res.json({ task, parents })
        } else {
          res.json({ task: null })
        }
      }
    ))

    router.post('/api/v1/task/:id/release', unhandledExceptionsHandler(
      async (req, res) => {
        const error = req.body.error || null
        const output = req.body.output || null
        const children = req.body.children || []
        if (!req.body.workerId) {
          throw new Error('workerId is required!')
        }
        const workerId = req.body.workerId
        const workgroupDelayInSeconds = req.body.workgroupDelayInSeconds || 0
        const releaseResult = await Task.release(new ObjectId(req.params.id), workerId, error, output, children, workgroupDelayInSeconds)
        res.json(releaseResult)
      }
    ))
  })

  const freeAbandonedCron = cron.schedule('* * * * *', () => {
    Task.freeAbandoned().then((result) => {
      if (result.modifiedCount > 0) {
        console.log(`~~ freed ${result.modifiedCount} abandoned tasks`)
      }
    })
  })

  const cleanExpiredGroupsCron = cron.schedule('30 3 * * *', () => {
    if ((process.env.CREW_CLEAN_EXPIRED_GROUPS || 'yes') === 'yes') {
      TaskGroup.cleanExpired().then((result) => {
        if (result.length > 0) {
          console.log(`~~ removed ${result.length} expired task groups`)
        }
      })
    }
  })

  const syncParentsCompleteCron = cron.schedule('*/5 * * * *', () => {
    Task.syncParents().then((count) => {
      console.log(`~~ syncd ${count} task's parentsComplete`)
    })
  })

  // Graceful shutdown for use within render.com or kubernetes - can be disabled with an env var
  if (process.env.CREW_GRACEFUL_SHUTDOWN !== 'no') {
    console.log('~~ Enabling graceful shutdown')
    terminus.createTerminus(options.server, {
      signal: 'SIGINT',
      signals: ['SIGUSR1', 'SIGUSR2'],
      timeout: 29000,
      onSignal: async (): Promise<void> => {
        // Cleanup all resources
        console.log('~~ Terminus signal : cleaning up...')
        freeAbandonedCron.stop()
        cleanExpiredGroupsCron.stop()
        syncParentsCompleteCron.stop()

        // Close database connection
        console.log('~~ Closing database connection')
        if (client) {
          await client.close()
        }
        databaseConnected = false
      },
      onShutdown: async (): Promise<void> => {
        console.log('~~ Terminus shutdown complete.')
      }
    })
  }
  return router
}

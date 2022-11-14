import express from 'express'
import terminus from '@godaddy/terminus'
import { MongoClient, ObjectId } from 'mongodb'
import initDb from './database'
import TaskGroup from './TaskGroup'
import Task from './Task'
import TaskChild from './TaskChild'
import Worker from './Worker'
import HttpWorker from './HttpWorker'
import WorkerGroup from './WorkerGroup'
import HttpWorkerGroup from './HttpWorkerGroup'
import TaskResponse from './TaskResponse'
import WorkerServer from './WorkerServer'
import WorkerServerInterface from './WorkerServerInterface'
import TaskError from './TaskError'
import cron from 'node-cron'
import { Socket, Server } from 'socket.io'
import http from 'http'
import cors from 'cors'
import CrewDatabase from './CrewDatabase'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import path from 'path'
import emitter from './realtime'
import Operator from './Operator'
import Messenger from './Messenger'
import GoogleCloudTasksMessenger from './messengers/GoogleCloudTasksMessenger'
import InlineMessenger from './messengers/InlineMessenger'
import { setMessenger } from './Messenger'

interface CrewOptions {
  server: http.Server,
  io?: Server,
  authenticateSocket?: (socket: Socket, message: any) => boolean,
  messenger?: Messenger
}

function crew (options: CrewOptions) : express.Router {
  // Crew uses its own router
  const router = express.Router()
  router.use(cors())
  router.use(express.json({ limit: '10MB'}))

  const swaggerSpec = swaggerJSDoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Crew API',
        version: '1.0.0',
      },
    },
    apis: [
      // dev
      path.resolve(__dirname, '*.ts'),
      // release
      path.resolve(__dirname, '../../src/*.ts')
    ]
  })
  router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

  // Set messenger
  if (options.messenger) {
    setMessenger(options.messenger)
  }

  // Create websocket server if one wasn't provided
  if (!options.io) {
    const io = new Server(options.server, {
      cors: {
        origin: '*',
        methods: ["GET", "POST"]
      }
    })
    options.io = io
    emitter.io = io
  } else {
    emitter.io = options.io
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

  function authorizeCloudTaskEndpoint(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.query.accessToken = process.env.CREW_CLOUD_TASK_ACCESS_TOKEN || '') {
      return next()
    }
    return res.status(401).send({ error: 'Access token is invalid!' })
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

    // Don't call these at startup - causes overload/freeze
    // // Bootstrap tasks (also done in cron below)
    // Task.bootstrap().then(() => {
    //   console.log(`~~ bootstraped tasks`)
    // })
    // Task.syncParents().then(() => {
    //   console.log(`~~ ran syncParents`)
    // })

    // Home
    router.get('/', unhandledExceptionsHandler(
      async (req, res) => {
      if (!req.originalUrl.endsWith('/')) {
        return res.redirect(req.originalUrl + '/')
      }
      res.send(`<html><body>Hi!  I'm Crew.  You\'ll need to use my <a href="./api-docs">API</a> or my UI to see what is going on.</body></html>`)
    }))

    /**
     * @openapi
     * /healthz:
     *   get:
     *     description: Check if the crew API server is healthy.
     *     tags:
     *       - devops
     *     responses:
     *       200:
     *         description: Health check result.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 healthy:
     *                   type: boolean
     */
    router.get('/healthz', unhandledExceptionsHandler(
      async (req, res) => {
      await database.client.db().admin().listDatabases()
      if (!databaseConnected) {
        res.status(500)
      }
      res.json({ healthy: databaseConnected })
    }))

    /**
     * @openapi
     * /api/v1/task_groups:
     *   get:
     *     description: Retrieve a list of task groups.
     *     tags:
     *       - task_group
     *     parameters:
     *       - in: query
     *         name: limit
     *         required: false
     *         description: Maximum number of task groups to retrieve.
     *         default: 50
     *         schema:
     *           type: integer
     *       - in: query
     *         name: skip
     *         required: false
     *         description: How many task groups to skip.
     *         default: 0
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: An array of task groups.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 $ref: '#/components/schemas/TaskGroup'
     */
    router.get('/api/v1/task_groups', unhandledExceptionsHandler(
      async (req, res) => {
        const limit = parseInt(req.query.limit as string || '50')
        const skip = parseInt(req.query.skip as string || '0')
        const groups = await TaskGroup.findAll(limit, skip)
        res.json(groups)
      }
    ))

    /**
     * @openapi
     * /api/v1/task_groups/count:
     *   get:
     *     description: Retrieve the total count of task groups.
     *     tags:
     *       - task_group
     *     responses:
     *       200:
     *         description: The total count of task groups.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 count:
     *                   type: integer
     */
    router.get('/api/v1/task_groups/count', unhandledExceptionsHandler(
      async (req, res) => {
        const count = await TaskGroup.countAll()
        res.json({ count })
      }
    ))

    /**
     * @openapi
     * /api/v1/task_group/{id}:
     *   get:
     *     description: Retrieve a single task group.
     *     tags:
     *       - task_group
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task group to retrieve.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: A task group.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/TaskGroup'
     */
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

    /**
     * @openapi
     * /api/v1/task/{id}:
     *   get:
     *     description: Retrieve a single task.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task to retrieve.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: A task.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/Task'
     */
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

    /**
     * @openapi
     * /api/v1/task_group/{id}/tasks:
     *   get:
     *     description: Retrieve a list of tasks within a group.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task group.
     *         schema:
     *           type: string
     *       - in: query
     *         name: limit
     *         required: false
     *         description: Maximum number of tasks to retrieve.  Set to -1 to retrieve all.
     *         default: -1
     *         schema:
     *           type: integer
     *       - in: query
     *         name: skip
     *         required: false
     *         description: How many tasks to skip.
     *         default: 0
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: An array of tasks.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 $ref: '#/components/schemas/Task'
     */
    router.get('/api/v1/task_group/:id/tasks', unhandledExceptionsHandler(
      async (req, res) => {
        const limit = parseInt(req.query.limit as string || '-1')
        const skip = parseInt(req.query.skip as string || '0')
        const tasks = await Task.findAllInGroup(new ObjectId(req.params.id), limit, skip)
        res.json(tasks)
      }
    ))

    /**
     * @openapi
     * /api/v1/channel/{channel}/tasks:
     *   get:
     *     description: Retrieve a list of tasks with the same channel.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: channel
     *         required: true
     *         description: The channel.
     *         schema:
     *           type: string
     *       - in: query
     *         name: limit
     *         required: false
     *         description: Maximum number of tasks to retrieve.
     *         default: 50
     *         schema:
     *           type: integer
     *       - in: query
     *         name: skip
     *         required: false
     *         description: How many tasks to skip.
     *         default: 0
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: An array of tasks.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 $ref: '#/components/schemas/Task'
     */
    router.get('/api/v1/channel/:id/tasks', unhandledExceptionsHandler(
      async (req, res) => {
        const limit = parseInt(req.query.limit as string || '50')
        const skip = parseInt(req.query.skip as string || '0')
        const tasks = await Task.findAllInChannel(limit, skip, req.params.id as string)
        res.json(tasks)
      }
    ))

    /**
     * @openapi
     * /api/v1/channels:
     *   get:
     *     description: Retrieve a list of channels.  Note that channels are a created as a side effect of creating tasks.
     *     tags:
     *       - channel
     *     responses:
     *       200:
     *         description: An array of channels.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: string
     */
    router.get('/api/v1/channels', unhandledExceptionsHandler(
      async (req, res) => {
        const channelStats = await Task.getChannels()
        res.json(channelStats)
      }
    ))

    /**
     * @openapi
     * /api/v1/task_groups:
     *   post:
     *     description: Create a new task group.
     *     tags:
     *       - task_group
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             $ref: '#/components/schemas/CreateTaskGroup'
     *     responses:
     *       200:
     *         description: The new task group.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/TaskGroup'
     */
    router.post('/api/v1/task_groups', unhandledExceptionsHandler(
      async (req, res) => {
        const group = await TaskGroup.fromData(req.body)
        res.json(group)
      }
    ))

    /**
     * @openapi
     * /api/v1/task_group/{id}/tasks:
     *   post:
     *     description: Create a new task within a group.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task group.
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             $ref: '#/components/schemas/CreateTask'
     *     responses:
     *       200:
     *         description: The new task.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/Task'
     */
    router.post('/api/v1/task_group/:id/tasks', unhandledExceptionsHandler(
      async (req, res) => {
        const task = await Task.fromData(new ObjectId(req.params.id), req.body)
        res.json(task)
      }
    ))

    /**
     * @openapi
     * /api/v1/task_group/{id}:
     *   delete:
     *     description: Delete a task group.
     *     tags:
     *       - task_group
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task group to delete.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: MongoDB delete result.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     */
    router.delete('/api/v1/task_group/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const deleteResult = await TaskGroup.deleteById(new ObjectId(req.params.id))
        res.json(deleteResult)
      }
    ))

    /**
     * @openapi
     * /api/v1/task/{id}:
     *   delete:
     *     description: Delete a task.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task to delete.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: MongoDB delete result.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     */
    router.delete('/api/v1/task/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const deleteResult = await Task.deleteById(new ObjectId(req.params.id))
        res.json(deleteResult)
      }
    ))

    /**
     * @openapi
     * /api/v1/task_group/{id}/reset:
     *   post:
     *     description: Reset a task group.  If the group has seed tasks, all non-seed tasks are removed.  Then all remaining tasks within the group are reset.
     *     tags:
     *       - task_group
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task group to reset.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: The task group.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/TaskGroup'
     */
    router.post('/api/v1/task_group/:id/reset', unhandledExceptionsHandler(
      async (req, res) => {
        // TODO remaining attempts
        const resetResult = await TaskGroup.resetById(new ObjectId(req.params.id))
        res.json(resetResult)
      }
    ))

    /**
     * @openapi
     * /api/v1/task_group/{id}/retry:
     *   post:
     *     description: Force a retry all incomplete tasks in a task group by incrementing their remainingAttempts value.
     *     tags:
     *       - task_group
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task group to retry.
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               remainingAttempts:
     *                 type: integer
     *                 description: How much to increment each incomplete task's remainingAttempts.
     *                 default: 2
     *     responses:
     *       200:
     *         description: The task group.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/TaskGroup'
     */
    router.post('/api/v1/task_group/:id/retry', unhandledExceptionsHandler(
      async (req, res) => {
        const remainingAttempts = parseInt(req.body.remainingAttempts || '2')
        const retryResult = await TaskGroup.retryById(new ObjectId(req.params.id), remainingAttempts)
        res.json(retryResult)
      }
    ))

    /**
     * @openapi
     * /api/v1/task_group/{id}/pause:
     *   post:
     *     description: Pause a task group.  All tasks within the task group are also paused.
     *     tags:
     *       - task_group
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task group to pause.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: The task group.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/TaskGroup'
     */
    router.post('/api/v1/task_group/:id/pause', unhandledExceptionsHandler(
      async (req, res) => {
        const resetResult = await TaskGroup.syncPauseById(new ObjectId(req.params.id), true)
        res.json(resetResult)
      }
    ))

    /**
     * @openapi
     * /api/v1/task_group/{id}/resume:
     *   post:
     *     description: Resume a task group.  All tasks within the task group are also un-paused.
     *     tags:
     *       - task_group
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task group to resume.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: The task group.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/TaskGroup'
     */
    router.post('/api/v1/task_group/:id/resume', unhandledExceptionsHandler(
      async (req, res) => {
        const resetResult = await TaskGroup.syncPauseById(new ObjectId(req.params.id), false)
        res.json(resetResult)
      }
    ))

    /**
     * @openapi
     * /api/v1/task/{id}/reset:
     *   post:
     *     description: Reset a task as if it had never been run.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task to reset.
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               remainingAttempts:
     *                 type: integer
     *                 description: How to set each task's remainingAttempts.
     *                 default: 2
     *     responses:
     *       200:
     *         description: The task.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/Task'
     */
    router.post('/api/v1/task/:id/reset', unhandledExceptionsHandler(
      async (req, res) => {
        const remainingAttempts = parseInt(req.body.remainingAttempts || '2')
        const resetResult = await Task.resetById(new ObjectId(req.params.id), remainingAttempts)
        res.json(resetResult)
      }
    ))

    /**
     * @openapi
     * /api/v1/task/{id}/retry:
     *   post:
     *     description: Force a retry of a task incrementing its remainingAttempts value.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task to retry.
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               remainingAttempts:
     *                 type: integer
     *                 description: How to much to increment each task's remainingAttempts.
     *                 default: 2
     *     responses:
     *       200:
     *         description: The task.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/Task'
     */
    router.post('/api/v1/task/:id/retry', unhandledExceptionsHandler(
      async (req, res) => {
        const remainingAttempts = parseInt(req.body.remainingAttempts || '2')
        const resetResult = await Task.retryById(new ObjectId(req.params.id), remainingAttempts)
        res.json(resetResult)
      }
    ))

    /**
     * @openapi
     * /api/v1/task/{id}/pluck:
     *   post:
     *     description: Take the given task and create a (reset) clone of it in a new task group.  Useful for debugging workers.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task to pluck.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: The cloned task.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/Task'
     */
    router.post('/api/v1/task/:id/pluck', unhandledExceptionsHandler(
      async (req, res) => {
        const task = await Task.pluckById(new ObjectId(req.params.id))
        res.json(task)
      }
    ))

    /**
     * @openapi
     * /api/v1/task/{id}:
     *   put:
     *     description: Update a task.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task to update.
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             $ref: '#/components/schemas/CreateTask'
     *     responses:
     *       200:
     *         description: The updated task.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/Task'
     */
    router.put('/api/v1/task/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const task = await Task.updateById(new ObjectId(req.params.id), req.body)
        res.json(task)
      }
    ))

    /**
     * @openapi
     * /api/v1/task_group/{id}:
     *   put:
     *     description: Update a task group.
     *     tags:
     *       - task_group
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the task group to update.
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             $ref: '#/components/schemas/CreateTaskGroup'
     *     responses:
     *       200:
     *         description: The updated task group.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/TaskGroup'
     */
    router.put('/api/v1/task_group/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const group = await TaskGroup.updateById(new ObjectId(req.params.id), req.body)
        res.json(group)
      }
    ))

    /**
     * @openapi
     * /api/v1/channel/{channel}/acquire:
     *   post:
     *     description: Workers use this endpoint to ask for a task to complete.
     *     tags:
     *       - task
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               workerId:
     *                 type: string
     *                 description: Unique id of the worker requesting a task.
     *     parameters:
     *       - in: path
     *         name: channel
     *         required: true
     *         description: Channel to fetch task from.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: The acquired task.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 task:
     *                   type: object
     *                   $ref: '#/components/schemas/Task'
     *                   description: The task to perform.  Will be null if no tasks are available.
     *                 parents:
     *                   type: array
     *                   description: Information about each task's parent.  Includes parent's input and output so child tasks can inherit data.
     *                   items:
     *                     type: object
     *                     $ref: '#/components/schemas/TaskParentData'
     */
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

    /**
     * @openapi
     * /api/v1/task/{id}/examine:
     *   post:
     *     description: Orchestration uses this enpoint to examine a task to find out if it is eligible for execution.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of task to examine
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Examine result.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     */
     router.post('/api/v1/task/:id/examine', authorizeCloudTaskEndpoint, unhandledExceptionsHandler(
      async (req, res) => {
        const task = await Task.findById(new ObjectId(req.params.id))
        if (task) {
          await Task.examine(new ObjectId(task._id))
          res.json({ success: true })
        } else {
          res.json({ task: null })
        }
      }
    ))

    /**
     * @openapi
     * /api/v1/task/{id}/execute:
     *   post:
     *     description: Orchestration uses this enpoint to execute a task to find out if it is eligible for execution.
     *     tags:
     *       - task
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of task to execute
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Execute result.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     */
     router.post('/api/v1/task/:id/execute', authorizeCloudTaskEndpoint, unhandledExceptionsHandler(
      async (req, res) => {
        const task = await Task.findById(new ObjectId(req.params.id))
        if (task) {
          await Operator.execute(new ObjectId(task._id))
          res.json({ success: true })
        } else {
          res.json({ task: null })
        }
      }
    ))

    /**
     * @openapi
     * /api/v1/task/{id}/release:
     *   post:
     *     description: Workers use this endpoint to return the result of completing or failing a task.
     *     tags:
     *       - task
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             $ref: '#/components/schemas/ReleaseTask'
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of task to release.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: The released task.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/Task'
     */
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
        const childrenDelayInSeconds = req.body.childrenDelayInSeconds || 0
        const releaseResult = await Task.release(new ObjectId(req.params.id), workerId, error, output, children, workgroupDelayInSeconds, childrenDelayInSeconds)
        res.json(releaseResult)
      }
    ))

    /**
     * @openapi
     * /api/v1/operators:
     *   get:
     *     description: Retrieve a list of operators.
     *     tags:
     *       - operator
     *     parameters:
     *       - in: query
     *         name: limit
     *         required: false
     *         description: Maximum number of operators to retrieve.
     *         default: 50
     *         schema:
     *           type: integer
     *       - in: query
     *         name: skip
     *         required: false
     *         description: How many operators to skip.
     *         default: 0
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: An array of operators.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 $ref: '#/components/schemas/Operator'
     */
     router.get('/api/v1/operators', unhandledExceptionsHandler(
      async (req, res) => {
        const limit = parseInt(req.query.limit as string || '50')
        const skip = parseInt(req.query.skip as string || '0')
        const operators = await Operator.findAll(limit, skip)
        res.json(operators)
      }
    ))

    /**
     * @openapi
     * /api/v1/operators/count:
     *   get:
     *     description: Retrieve the total count of operators.
     *     tags:
     *       - task_group
     *     responses:
     *       200:
     *         description: The total count of operators.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 count:
     *                   type: integer
     */
    router.get('/api/v1/operators/count', unhandledExceptionsHandler(
      async (req, res) => {
        const count = await Operator.countAll()
        res.json({ count })
      }
    ))

    /**
     * @openapi
     * /api/v1/operator/{id}:
     *   get:
     *     description: Retrieve a single operator.
     *     tags:
     *       - operator
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the operator to retrieve.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: An operator.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/Operator'
     */
    router.get('/api/v1/operator/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const operator = await Operator.findById(new ObjectId(req.params.id))
        if (operator) {
          res.json(operator)
        } else {
          res.status(404).json({ message: `Operator with id ${req.params.id} not found!` })
        }
      }
    ))

    /**
     * @openapi
     * /api/v1/operators:
     *   post:
     *     description: Create a new operator.
     *     tags:
     *       - operator
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             $ref: '#/components/schemas/CreateOperator'
     *     responses:
     *       200:
     *         description: The new operator.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/Operator'
     */
     router.post('/api/v1/operators', unhandledExceptionsHandler(
      async (req, res) => {
        const operator = await Operator.fromData(req.body)
        res.json(operator)
      }
    ))

    /**
     * @openapi
     * /api/v1/operator/{id}:
     *   put:
     *     description: Update an operator.
     *     tags:
     *       - operator
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the operator to update.
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             $ref: '#/components/schemas/CreateOperator'
     *     responses:
     *       200:
     *         description: The updated operator.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/Operator'
     */
     router.put('/api/v1/operator/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const operator = await Operator.updateById(new ObjectId(req.params.id), req.body)
        res.json(operator)
      }
    ))

    /**
     * @openapi
     * /api/v1/operator/{id}:
     *   delete:
     *     description: Delete an operator.
     *     tags:
     *       - operator
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Id of the operator to delete.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: MongoDB delete result.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     */
     router.delete('/api/v1/operator/:id', unhandledExceptionsHandler(
      async (req, res) => {
        const deleteResult = await Operator.deleteById(new ObjectId(req.params.id))
        res.json(deleteResult)
      }
    ))

    /**
     * @openapi
     * /api/v1/clean:
     *   post:
     *     description: Run a clean cycle - removes old task groups.
     *     tags:
     *       - admin
     *     responses:
     *       200:
     *         description: Admin task succeeded
     */
     router.all('/api/v1/clean', unhandledExceptionsHandler(
      async (req, res) => {
        if ((process.env.CREW_CLEAN_EXPIRED_GROUPS || 'yes') === 'yes') {
          let batch = (req.query.batch as string) || ''
          if (!batch) {
            batch = process.env.CREW_CLEAN_BATCH_SIZE || '20'
          }
          await TaskGroup.cleanExpired(parseInt(batch))
        }
        res.send({success: true})
      }
    ))

    /**
     * @openapi
     * /api/v1/bootstrap:
     *   post:
     *     description: Run a bootstrap cycle - finds and restarts stalled tasks.
     *     tags:
     *       - admin
     *     responses:
     *       200:
     *         description: Admin task succeeded
     */
     router.all('/api/v1/bootstrap', unhandledExceptionsHandler(
      async (req, res) => {
        let batch = (req.query.batch as string) || ''
        if (!batch) {
          batch = process.env.CREW_BOOTSTRAP_BATCH_SIZE || '100'
        }
        await Task.bootstrap(parseInt(batch))
        res.send({success: true})
      }
    ))

    /**
     * @openapi
     * /api/v1/sync:
     *   post:
     *     description: Forces a sync of all tasks parentsComplete property.
     *     tags:
     *       - admin
     *     responses:
     *       200:
     *         description: Admin task succeeded
     */
     router.all('/api/v1/sync', unhandledExceptionsHandler(
      async (req, res) => {
        let batch = (req.query.batch as string) || ''
        if (!batch) {
          batch = process.env.CREW_SYNC_BATCH_SIZE || '100'
        }
        await Task.syncParents(parseInt(batch))
        res.send({success: true})
      }
    ))
  })

  let bootstrapOperatorsCron : cron.ScheduledTask | null = null
  let cleanExpiredGroupsCron : cron.ScheduledTask | null = null
  let syncParentsCompleteCron : cron.ScheduledTask | null = null

  // Allow cron to be disabled so tasks can be run by external scheduler if desired
  if (process.env.CREW_USE_EXTERNAL_CRON !== 'yes') {
    bootstrapOperatorsCron = cron.schedule((process.env.CREW_BOOTSTRAP_SCHEDULE || '* * * * *'), () => {
      Task.bootstrap(parseInt(process.env.CREW_BOOTSTRAP_BATCH_SIZE || '100')).then(() => {
        console.log(`~~ bootstrapped tasks`)
      })
    })

    cleanExpiredGroupsCron = cron.schedule((process.env.CREW_CLEAN_SCHEDULE || '0 * * * *'), () => {
      if ((process.env.CREW_CLEAN_EXPIRED_GROUPS || 'yes') === 'yes') {
        TaskGroup.cleanExpired(parseInt(process.env.CREW_SYNC_CLEAN_SIZE || '20')).then((result) => {
          if (result.length > 0) {
            console.log(`~~ removed ${result.length} expired task groups`)
          }
        })
      }
    })

    syncParentsCompleteCron = cron.schedule((process.env.CREW_SYNC_SCHEDULE || '* * * * *'), () => {
      Task.syncParents(parseInt(process.env.CREW_SYNC_BATCH_SIZE || '100')).then((count) => {
        console.log(`~~ syncd ${count} task's parentsComplete`)
      })
    })
  }

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
        if (cleanExpiredGroupsCron != null) {
          cleanExpiredGroupsCron.stop()
        }
        if (syncParentsCompleteCron != null) {
          syncParentsCompleteCron.stop()
        }
        if (bootstrapOperatorsCron != null) {
          bootstrapOperatorsCron.stop()
        }

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

export default crew

export {
  crew,
  TaskGroup,
  Task,
  Worker,
  HttpWorker,
  WorkerGroup,
  HttpWorkerGroup,
  TaskResponse,
  TaskChild,
  TaskError,
  WorkerServer,
  WorkerServerInterface,
  Messenger,
  GoogleCloudTasksMessenger,
  InlineMessenger
}

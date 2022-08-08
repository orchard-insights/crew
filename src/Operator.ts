import { ObjectId } from "mongodb"
import { DateTime } from 'luxon'
import realtime from './realtime'
import initDb from './database'
import Task from "./Task"
import axios, { AxiosRequestConfig } from 'axios'
import { getMessenger } from "./Messenger"

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateOperator:
 *       type: object
 *       properties:
 *         channel:
 *           type: string
 *           required: true
 *           description: Which channel this operator can manage tasks for.
 *         url:
 *           type: string
 *           description: Url the operator should POST tasks to.
 *         requestConfig:
 *           type: object
 *           description: Axios request config to use when POSTing the task (for adding Authorization headers).
 *         isPaused:
 *           type: boolean
 *           description: When true, this operator will not proxy requests to url.
 *           default: false
 *     Opeartor:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateOperator'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             createdAt:
 *               type: string
 */
export default class Operator {
  _id?: ObjectId
  channel: string
  url: string
  requestConfig: object | null
  isPaused: boolean
  createdAt: Date
  
  constructor(channel: string, url: string, requestConfig: object | null = null, isPaused = false) {
    this.channel = channel
    this.url = url
    this.requestConfig = requestConfig
    this.isPaused = isPaused
    this.createdAt = DateTime.utc().toJSDate()
  }

  static async findAll(limit = 50, skip = 0) : Promise<Operator[]> {
    const { operatorCollection } = await initDb()
    const operators = await operatorCollection.find().limit(limit).skip(skip).sort( { createdAt: -1 } ).toArray()
    return operators as Operator[]
  }

  static async countAll() : Promise<number> {
    const { operatorCollection } = await initDb()
    const count = await operatorCollection.countDocuments({})
    return count
  }

  static async findById(id: ObjectId) : Promise<Operator> {
    const { operatorCollection } = await initDb()
    const operator = await operatorCollection.findOne({_id: id}) as Operator
    return operator
  }

  static async updateById(id: ObjectId, updates: any) : Promise<Operator> {
    const { operatorCollection } = await initDb()
    // Cannot update:
    delete updates.createdAt
    await operatorCollection.updateOne(
      {_id: id},
      { $set: updates }
    )
    const operator = await Operator.findById(id)
    realtime.emit ('operators', 'operator:update', operator)

    await Operator.bootstrap(operator)

    return operator
  }

  // Helper to create an operator from a POST request
  static async fromData(data: any) : Promise<Operator> {
    const { operatorCollection } = await initDb()

    const document : Operator = {
      channel: data.channel,
      url: data.url,
      requestConfig: data.requestConfig || null,
      isPaused: data.isPaused, // Should always be in sync with group!
      createdAt: DateTime.utc().toJSDate()
    }

    const insertResult = await operatorCollection.insertOne(document)
    const operator = await Operator.findById(insertResult.insertedId) as Operator
    realtime.emit ('operators', 'operator:create', operator)

    return operator
  }

  static async deleteById(id: ObjectId) : Promise<any> {
    const { operatorCollection } = await initDb()
    const operator = await Operator.findById(id)
    const deleteResult = await operatorCollection.deleteOne( { '_id': id })
    realtime.emit ('operators', 'operator:delete', operator)
    return deleteResult
  }

  static async bootstrapAll() {
    // Since operators depend on events which may have gotten lost,
    // periodically trigger a set of events for each operator in order
    // to re-start the event flow.
    const { operatorCollection } = await initDb()
    const operators = await operatorCollection.find().sort( { createdAt: -1 } ).toArray() as Operator[]
    for (const operator of operators) {
      await Operator.bootstrap(operator)
    }
  }

  static async bootstrap(operator: Operator) : Promise<void> {
    // If an operator is unpaused, bootstrap tasks
    if (!operator.isPaused) {
      const limit = 100
      let skip = 0
      let hasMore = true
      while (hasMore) {
        const tasks = await Task.findAllInChannel(limit, skip, operator.channel)
        const messenger = await getMessenger()
        for (const task of tasks) {
          if (task._id) {
            messenger.publishExamineTask(task._id.toString(), 0)
          }
        }
        skip = skip + limit
        if (tasks.length < limit) {
          hasMore = false
        }
      }
    }
  }

  static async execute(taskId: ObjectId) : Promise<void> {
    // Load the task to get channel to execute in, we are not going to execute this specific task though, only whatever we can acquire in its channel.
    const executeTask = await Task.findById(taskId)
    if (executeTask) {
      const channel = executeTask.channel

      // Get operator for channel
      const { operatorCollection } = await initDb()

      let operator: Operator
      if (process.env.CREW_VIRTUAL_OPERATOR_BASE_URL) {
        // If all workers are HTTP and all are on a single base url then we can
        // automatically create operators for every channel

        // Allow virtual operators to authenticate their requests to workers with
        // a token configured via env vars
        const operatorRequestConfig : any = {}
        if (process.env.CREW_VIRTUAL_OPERATOR_AUTH_TOKEN) {
          operatorRequestConfig.headers = {
            'Authorization': 'Bearer ' + process.env.CREW_VIRTUAL_OPERATOR_AUTH_TOKEN
          }
        }

        // Create the virtual operator
        operator = new Operator(channel, process.env.CREW_VIRTUAL_OPERATOR_BASE_URL + channel, operatorRequestConfig, false)
        operator._id = ObjectId.createFromTime(new Date().getTime() / 1000)
      } else {
        operator = await operatorCollection.findOne({channel: channel}) as Operator
      }
      
      if (operator) {
        const workerId = "operator_" + operator._id

        if (operator.isPaused) {
          return
        }

        // If there is an operator for the channel, try to acquire the task
        const task = await Task.operatorAcquire(taskId, workerId)
        if (task && task._id) {
          console.log('~~ execute task ' + task._id + ' (operator)')

          // Load parent data
          const parents = await Task.getParentsData(task)

          // Prepare axios request config
          const config : AxiosRequestConfig = {
            ...operator.requestConfig
          }

          try {
            // Send request to operator's url
            console.log('~~ Operator making call to : ' + operator.url)
            const response = await axios.post(operator.url, {input: task.input, parents, taskId: task._id}, config)

            // Unpack response
            const { error, output, children } = response.data
            // Release the task
            await Task.release(task._id, workerId, error, output, children)
          } catch (error) {
            console.error('~~ Operator error', error)
            if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.error) {
              console.error('~~ Operator http call error', error.response.data.error)
              await Task.release(task._id, workerId, error.response.data.error)
            } else if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.message) {
              console.error('~~ Operator http call error', error.response.data.message)
              await Task.release(task._id, workerId, error.response.data.message)
            } else {
              console.error('~~ Operator http call error', (error as Error).message)
              await Task.release(task._id, workerId, (error as Error).message)
            }
          }
        }
      }
    }
  }
}

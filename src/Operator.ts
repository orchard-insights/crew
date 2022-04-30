import { ObjectId } from "mongodb"
import _ from 'lodash'
import { DateTime } from 'luxon'
import realtime from './realtime'
import initDb from './database'
import Task from "./Task"
import axios, { AxiosRequestConfig } from 'axios'

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
 *         maxConcurrency:
 *           type: integer
 *           default: 5
 *           description: Max number of operator tasks to execute at once.
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
  maxConcurrency: number
  isPaused: boolean
  createdAt: Date
  
  constructor(channel: string, url: string, requestConfig: object | null = null, maxConcurrency = 5, isPaused = false) {
    this.channel = channel
    this.url = url
    this.requestConfig = requestConfig
    this.maxConcurrency = maxConcurrency
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

    // If an operator is unpaused, bootstrap tasks
    if (!updates.isPaused) {
      const limit = operator.maxConcurrency || 10
      const tasks = await Task.findAllInChannel(limit, 0, operator.channel)
      for (const task of tasks) {
        if (task._id) {
          Operator.execute(task._id)
        }
      }
    }
    return operator
  }

  // Helper to create an operator from a POST request
  static async fromData(data: any) : Promise<Operator> {
    const { operatorCollection } = await initDb()

    const document : Operator = {
      channel: data.channel,
      url: data.url,
      requestConfig: data.requestConfig || null,
      maxConcurrency: data.maxConcurrency || 5,
      isPaused: data.isPaused, // Should always be in sync with group!
      createdAt: DateTime.utc().toJSDate()
    }

    const insertResult = await operatorCollection.insertOne(document)
    const operator = await Operator.findById(insertResult.insertedId) as Operator
    realtime.emit ('operators', 'operator:create', operator)

    if (!operator.isPaused) {
      const limit = operator.maxConcurrency || 10
      const tasks = await Task.findAllInChannel(limit, 0, operator.channel)
      for (const task of tasks) {
        if (task._id) {
          Operator.execute(task._id)
        }
      }
    }

    return operator
  }

  static async deleteById(id: ObjectId) : Promise<any> {
    const { operatorCollection } = await initDb()
    const operator = await Operator.findById(id)
    const deleteResult = await operatorCollection.deleteOne( { '_id': id })
    realtime.emit ('operators', 'operator:delete', operator)
    return deleteResult
  }

  static async execute(taskId: ObjectId) : Promise<void> {
    // Load the task to get channel to execute in, we are not going to execute this specific task though, only whatever we can acquire in its channel.
    const examineTask = await Task.findById(taskId)
    if (examineTask) {
      const channel = examineTask.channel

      // Get operator for channel
      const { operatorCollection } = await initDb()
      const operator = await operatorCollection.findOne({channel: channel}) as Operator
      if (operator) {
        const workerId = "operator:" + operator._id

        if (operator.isPaused) {
          return
        }

        // Count how many tasks are assigned to workerId, bail if greater than operator.maxConcurrency
        if (operator.maxConcurrency > 0) {
          const assignedCount = await Task.countOperatorAssigned(channel, workerId)
          if (assignedCount >= operator.maxConcurrency) {
            return
          }
        }

        // If there is an operator for the channel, try to acquire a task
        const task = await Task.acquireInChannel(channel, workerId)
        if (task && task._id) {
          // Load parent data
          const parents = await Task.getParentsData(task)

          // Prepare axios request config
          const config : AxiosRequestConfig = {
            ...operator.requestConfig
          }

          try {
            // Send request to operator's url
            const response = await axios.post(operator.url, {input: task.input, parents}, config)

            // Unpack response
            const { error, output, children } = response.data
            // Release the task
            await Task.release(task._id, workerId, error, output, children)
          } catch (error) {
            if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.error) {
              await Task.release(task._id, workerId, error.response.data.error)
            } else if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.message) {
              await Task.release(task._id, workerId, error.response.data.message)
            } else {
              await Task.release(task._id, workerId, (error as Error).message)
            }          
          }
        }
      }
    }
  }
}

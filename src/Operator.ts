import { ObjectId } from "mongodb"
import _ from 'lodash'
import { DateTime } from 'luxon'
import realtime from './realtime'
import initDb from './database'

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
    return operator
  }

  static async deleteById(id: ObjectId) : Promise<any> {
    const { operatorCollection } = await initDb()
    const operator = await Operator.findById(id)
    const deleteResult = await operatorCollection.deleteOne( { '_id': id })
    realtime.emit ('operators', 'operator:delete', operator)
    return deleteResult
  }
}

import { ObjectId } from 'mongodb'
import { DateTime } from 'luxon'
import realtime from './realtime'
import initDb from './database'
import _ from 'lodash'
import Task from './Task'
import { getMessenger } from './Messenger'

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateTaskGroup:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         isPaused:
 *           type: boolean
 *           description: When true, tasks in the group cannot be acquired by workers.
 *           default: false
 *     TaskGroup:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateTaskGroup'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             createdAt:
 *               type: string
 */
export default class TaskGroup {
  _id?: ObjectId
  name: string
  isPaused: boolean
  createdAt: Date

  constructor(name: string, isPaused: boolean) {
    this.name = name
    this.isPaused = isPaused
    this.createdAt = DateTime.utc().toJSDate()
  }

  static async findAll(limit = 50, skip = 0) : Promise<TaskGroup[]> {
    const { groupCollection } = await initDb()
    const groups = await groupCollection.find().limit(limit).skip(skip).sort( { createdAt: -1 } ).toArray()
    return groups as TaskGroup[]
  }

  static async countAll() : Promise<number> {
    const { groupCollection } = await initDb()
    const count = await groupCollection.countDocuments({})
    return count
  }

  static async findById(id: ObjectId) : Promise<TaskGroup> {
    const { groupCollection } = await initDb()
    const group = await groupCollection.findOne({_id: id}) as TaskGroup
    return group
  }

  static async updateById(id: ObjectId, updates: any) : Promise<TaskGroup> {
    const { groupCollection } = await initDb()
    // Cannot update:
    delete updates.isPaused
    delete updates.createdAt
    await groupCollection.updateOne(
      {_id: id},
      { $set: updates }
    )
    const group = await TaskGroup.findById(id)
    realtime.emit (group._id + '', 'task_group:update', group)
    return group
  }

  static async fromData(data: any) : Promise<TaskGroup> {
    const { groupCollection } = await initDb()
    const document : TaskGroup = {
      name: data.name,
      isPaused: _.has(data, 'isPaused') ? data.isPaused : false,
      createdAt: DateTime.utc().toJSDate()
    }
    const insertResult = await groupCollection.insertOne(document)
    const group = await TaskGroup.findById(insertResult.insertedId)
    if (group && group._id) {
      realtime.emit (group._id + '', 'group:create', group)
    }
    return group
  }

  static async deleteById(id: ObjectId) : Promise<any> {
    const { groupCollection, taskCollection } = await initDb()
    const group = await TaskGroup.findById(id)
    // Delete tasks in group
    await taskCollection.deleteMany({ taskGroupId: id })
    // Delete group
    const deleteResult = await groupCollection.deleteOne( { '_id': id })
    if (group && group._id) {
      realtime.emit (group._id + '', 'group:delete', group)
    }
    return deleteResult
  }

  static async retryById(id: ObjectId, remainingAttempts = 2) : Promise<any> {
    const { taskCollection } = await initDb()
    const group = await TaskGroup.findById(id)
    await taskCollection.updateMany({ remainingAttempts: { $lt: 1 }, isComplete: false, taskGroupId: id }, { 
      $set: {
        remainingAttempts: remainingAttempts
      }
    })

    const tasks = await Task.findAllInGroup(id)
    for (const task of tasks) {
      await Task.triggerExamine(task, 0)
    }

    realtime.emit (id + '', 'group:retry', null)
    return group
  }

  static async resetById(id: ObjectId, remainingAttempts = 5) : Promise<TaskGroup> {
    const { taskCollection } = await initDb()
    const group = await TaskGroup.findById(id)

    const seedCount = await taskCollection.countDocuments( { taskGroupId: id, isSeed: true })

    // If has seed tasks, delete all non-seed tasks
    if (seedCount > 0) {
      const res = await taskCollection.deleteMany({ taskGroupId: id, isSeed: false })
    }

    await taskCollection.updateMany({ taskGroupId: id }, { 
      $set: {
        isComplete: false,
        isPaused: group.isPaused,
        parentsComplete: false,
        errors: [],
        output: null,
        runAfter: null,
        assignedTo: null,
        assignedAt: null,
        remainingAttempts: remainingAttempts
      }
    })

    const tasks = await Task.findAllInGroup(id)
    for (const task of tasks) {
      await Task.triggerExamine(task, 0)
    }

    realtime.emit (id + '', 'group:reset', null)
    return group
  }

  static async syncPauseById(id: ObjectId, isPaused = true) : Promise<TaskGroup> {
    const { groupCollection, taskCollection } = await initDb()
    const group = await TaskGroup.findById(id)

    // Pause tasks
    await taskCollection.updateMany({ taskGroupId: id }, { 
      $set: {
        isPaused: isPaused,
      }
    })

    // Pause task group
    await groupCollection.updateOne({ _id: id }, { $set: { isPaused }})
    group.isPaused = isPaused

    const tasks = await Task.findAllInGroup(id)
    for (const task of tasks) {
      await Task.triggerExamine(task, 0)
    }

    realtime.emit (id + '', 'group:syncPause', { isPaused })
    return group
  }

  static async cleanExpired() : Promise<TaskGroup[]> {
    const { groupCollection } = await initDb()
    const expiredGroupIntervalInDays = parseInt(process.env.CREW_EXPIRED_GROUP_INTERVAL_IN_DAYS || '7')
    const threshold = DateTime.utc().minus({ days: expiredGroupIntervalInDays }).toJSDate()
    const oldGroups = await groupCollection.find({ createdAt: { $lt: threshold } }).toArray() as TaskGroup[]
    const deleted : TaskGroup[] = []
    for (const oldGroup of oldGroups) {
      if (oldGroup._id) {
        await TaskGroup.deleteById(oldGroup._id)
      }
      deleted.push(oldGroup)
    }
    return deleted
  }
}

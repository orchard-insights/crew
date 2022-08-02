import { ObjectId } from "mongodb"
import _ from 'lodash'
import { DateTime } from 'luxon'
import TaskGroup from "./TaskGroup"
import TaskChild from "./TaskChild"
import Operator from "./Operator"
import realtime from './realtime'
import initDb from './database'
import { getMessenger } from './CloudTasks'

/**
 * @openapi
 * components:
 *   schemas:
 *     ReleaseTask:
 *       type: object
 *       properties:
 *         workerId:
 *           type: string
 *           description: The id of the worker releasing the task.  Must match the id of the worker that acquired the task.
 *         output:
 *           type: object
 *           description: Output data returned by the worker upon completing the task.
 *         error:
 *           type: object
 *           description: Error data.  Task will not get isComplete = true when present.
 *         workgroupDelayInSeconds:
 *           type: integer
 *           description: When present all tasks with the same workgroup will be paused for this many seconds.  Used to manage rate limits in 3rd party APIs.
 *         children:
 *           type: array
 *           items:
 *             type: object
 *             $ref: '#/components/schemas/TaskChild'
 *     TaskParentData:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Task id
 *         channel:
 *           type: string
 *         input:
 *           type: object
 *           description: Input data that the worker will need to complete the task.
 *         output:
 *           type: object
 *           description: Output data returned by the worker upon completing the task.
 *     CreateTask:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           required: true
 *         channel:
 *           type: string
 *           required: true
 *           description: Tasks of the same type will have the same channel.
 *         workgroup:
 *           type: string
 *           description: Use workgroups to manage tasks that may need to be paused together (to wait for rate limits).
 *         key:
 *           type: string
 *           description: A unique identifier for a task. Used to prevent duplicate tasks from being exectued more than once.
 *         remainingAttempts:
 *           type: integer
 *           default: 5
 *         isPaused:
 *           type: boolean
 *           description: When true, tasks in the group cannot be acquired by workers.
 *           default: false
 *         priority:
 *           type: integer
 *           description: Tasks with a higher priority get acquired before tasks with a lower priority.
 *           default: 0
 *         runAfter:
 *           type: integer
 *           description: Task cannot be acquired until this date and time has passed.
 *         progressWeight:
 *           type: integer
 *           description: Relative amount that this task contributes to the overall task group progress.
 *           default: 1
 *         isSeed:
 *           type: boolean
 *           description: When true, the task will not be removed when the task group is reset.  Seed tasks are usually responsible for creating child tasks.
 *           default: false
 *         errorDelayInSeconds:
 *           type: integer
 *           description: The task cannot be acquired for this many seconds after a failure.
 *           default: 30
 *         input:
 *           type: object
 *           description: Input data that the worker will need to complete the task.
 *         parentIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Ids of the task's parents.
 *     TaskChild:
 *       type: object
 *       properties:
 *         _child_id:
 *           type: string
 *           description: Unique pseudo-id for this child.  Will be re-assigned to a real _id by database upon creation.
 *         _parent_ids:
 *           type: array
 *           description: Pseudo-ids for the child's parents.  Used when returning a directed acyclic graph of child tasks.
 *           items:
 *             type: string
 *         name:
 *           type: string
 *           required: true
 *         channel:
 *           type: string
 *           required: true
 *           description: Tasks of the same type will have the same channel.
 *         workgroup:
 *           type: string
 *           description: Use workgroups to manage tasks that may need to be paused together (to wait for rate limits).
 *         key:
 *           type: string
 *           description: A unique identifier for a task. Used to prevent duplicate tasks from being exectued more than once.
 *         remainingAttempts:
 *           type: integer
 *           default: 5
 *         priority:
 *           type: integer
 *           description: Tasks with a higher priority get acquired before tasks with a lower priority.
 *           default: 0
 *         runAfter:
 *           type: integer
 *           description: Task cannot be acquired until this date and time has passed.
 *         progressWeight:
 *           type: integer
 *           description: Relative amount that this task contributes to the overall task group progress.
 *           default: 1
 *         errorDelayInSeconds:
 *           type: integer
 *           description: The task cannot be acquired for this many seconds after a failure.
 *           default: 30
 *         input:
 *           type: object
 *           description: Input data that the worker will need to complete the task.
 *     Task:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateTask'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             taskGroupId:
 *               type: string
 *               required: true
 *             parentsComplete:
 *               type: boolean
 *               description: When true, all parents of the task have been completed.
 *             isComplete:
 *               type: boolean
 *               description: When true, the task has been completed.
 *             output:
 *               type: object
 *               description: Output data returned by the worker upon completing the task.
 *             errors:
 *               type: array
 *               items:
 *                 type: object
 *               description: Error data recieved for each failed attempt.
 *             createdAt:
 *               type: string
 *             assignedTo:
 *               type: string
 *               description: Id of the worker that acquired this task. Workers self-report their own ids when acquiring.
 *             assignedAt:
 *               type: string
 *               description: The timestamp when the task was acquired.
 */
export default class Task {
  _id?: ObjectId
  taskGroupId: ObjectId
  name: string
  channel: string
  workgroup: string | null
  key: string | null
  remainingAttempts: number
  isPaused: boolean
  parentsComplete: boolean
  isComplete: boolean
  priority: number
  runAfter: Date | null
  progressWeight: number
  isSeed: boolean
  errorDelayInSeconds: number
  input: object | null
  output: object | null
  errors: object[]
  createdAt: Date
  parentIds: ObjectId[]
  assignedTo: string | null
  assignedAt: Date | null

  constructor(taskGroupId: ObjectId, name: string, channel: string, input: object | null = null, parentIds : ObjectId[] = [], isPaused = false, workgroup : string | null = null, key : string | null = null, remainingAttempts = 5, priority = 0, progressWeight = 1, isSeed = false) {
    this.taskGroupId = taskGroupId
    this.name = name
    this.channel = channel
    this.workgroup = workgroup
    this.key = key
    this.remainingAttempts = remainingAttempts
    this.isPaused = isPaused
    this.parentsComplete = !(parentIds.length > 0)
    this.isComplete = false
    this.priority = priority
    this.runAfter = null
    this.progressWeight = progressWeight
    this.isSeed = isSeed
    this.errorDelayInSeconds = 30
    this.input = input
    this.errors = []
    this.output = null
    this.createdAt = DateTime.utc().toJSDate()
    this.parentIds = parentIds
    this.assignedTo = null
    this.assignedAt = null
  }

  static async findById(id: ObjectId) : Promise<Task> {
    const { taskCollection } = await initDb()
    const task = await taskCollection.findOne({_id: id}) as Task
    return task
  }

  static async updateById(id: ObjectId, updates: any) : Promise<Task> {
    const { taskCollection } = await initDb()
    // Cannot update:
    delete updates.taskGroupId
    delete updates.isPaused
    delete updates.parentsComplete
    delete updates.isComplete
    delete updates.assignedTo
    delete updates.assignedAt
    delete updates.output
    delete updates.errors
    delete updates.createdAt
    if (_.has(updates, 'runAfter') && updates.runAfter) {
      updates.runAfter = DateTime.fromISO(updates.runAfter).toJSDate()
    }
    await taskCollection.updateOne(
      {_id: id},
      { $set: updates }
    )
    const task = await Task.findById(id)
    realtime.emit (task.taskGroupId + '', 'task:update', task)
    return task
  }

  // limit less than 0 means return all
  static async findAllInGroup(taskGroupId: ObjectId, limit = -1, skip = 0) : Promise<Task[]> {
    const { taskCollection } = await initDb()
    const q = taskCollection.find({ taskGroupId })
    if (limit > 0) {
      q.limit(limit)
    }
    const tasks = await q.skip(skip).sort( { createdAt: -1 } ).toArray()
    return tasks as Task[]
  }

  static async findAllInChannel(limit = 50, skip = 0, channel: string) : Promise<Task[]> {
    const { taskCollection } = await initDb()
    const tasks = await taskCollection.find({ channel }).limit(limit).skip(skip).sort( { createdAt: -1 } ).toArray()
    return tasks as Task[]
  }

  static async getChannels() {
    const { taskCollection } = await initDb()
    const channels = await taskCollection.distinct('channel')
    const channelStats : any[] = []
    for (const channel of channels) {
      const totalCount = await taskCollection.count({ channel })
      const completedCount = await taskCollection.count({ channel, isComplete: true })
      const assignedCount = await taskCollection.count({ channel, assignedTo: { $ne:null } })
      channelStats.push({
        name: channel,
        totalCount,
        completedCount, 
        assignedCount
      })
    }
    return channelStats
  }

  // Helper to create a task from a POST request
  static async fromData(taskGroupId : ObjectId, data: any) : Promise<Task> {
    const { taskCollection } = await initDb()
    const group = await TaskGroup.findById(taskGroupId)

    const document : Task = {
      taskGroupId,
      name: data.name,
      channel: data.channel,
      workgroup: data.workgroup || null,
      key: data.key || null,
      remainingAttempts: data.remainingAttempts || 5,
      isPaused: group.isPaused, // Should always be in sync with group!
      parentsComplete: false,
      isComplete: false,
      priority: data.priority || 0,
      runAfter: data.runAfter ? DateTime.fromISO(data.runAfter).toJSDate() : null,
      progressWeight: data.progressWeight || 1,
      isSeed: data.isSeed || false,
      errorDelayInSeconds: _.has(data, 'errorDelayInSeconds') ? data.errorDelayInSeconds : 30,
      input: data.input || null,
      errors: [],
      output: null,
      createdAt: DateTime.utc().toJSDate(),
      parentIds: [],
      assignedTo: null,
      assignedAt: null
    }

    if (data.parentIds) {
      let allParentsAreComplete = true

      const parentObjectIds : ObjectId[] = []
      for (const parentId of data.parentIds) {
        const parentObjectId = new ObjectId(parentId)
        parentObjectIds.push(parentObjectId)
        const parent = await Task.findById(parentObjectId)
        if (!parent) {
          throw new Error('Cannot create task with missing parent : ' + parentId)
        }
        if (!parent.isComplete) {
          allParentsAreComplete = false
        }
      }
      document.parentIds = parentObjectIds

      // Set parentsComplete based on check of each parent's current status
      document.parentsComplete = allParentsAreComplete
    }
    
    const insertResult = await taskCollection.insertOne(document)
    const task = await Task.findById(insertResult.insertedId) as Task
    realtime.emit (task.taskGroupId + '', 'task:create', task)
    return task
  }

  static async findChildren(id: ObjectId) : Promise<Task[]> {
    const { taskCollection } = await initDb()
    const children = await taskCollection.find( {parentIds: {$in: [id]}} ).toArray() as Task[]
    return children
  }

  static async findParents(id: ObjectId) : Promise<Task[]> {
    const task = await Task.findById(id)
    const parents = []
    for (const parentId of task.parentIds) {
      const parent = await Task.findById(parentId)
      if (parent) {
        parents.push(parent)
      }
    }
    return parents
  }

  static async deleteById(id: ObjectId) : Promise<any> {
    const { taskCollection } = await initDb()
    const task = await Task.findById(id)
    // Delete children
    const children = await Task.findChildren(id)
    for (const child of children) {
      if (child._id) {
        await Task.deleteById(child._id)
      }
    }
    // Delete self
    const deleteResult = await taskCollection.deleteOne( { '_id': id })
    realtime.emit (task.taskGroupId + '', 'task:delete', task)
    return deleteResult
  }

  // Resetting a task makes it look like it has never been run
  static async resetById(id: ObjectId, remainingAttempts = 5) : Promise<Task> {
    const { taskCollection } = await initDb()
    await taskCollection.updateOne({ _id: id }, { 
      $set: {
        isComplete: false,
        errors: [],
        output: null,
        runAfter: null,
        assignedTo: null,
        assignedAt: null,
        remainingAttempts: remainingAttempts
      }
    })
    const task = await Task.findById(id)
    realtime.emit (task.taskGroupId + '', 'task:update', task)
    return task
  }

  static async retryById(id: ObjectId, remainingAttempts = 2) : Promise<Task> {
    const { taskCollection } = await initDb()
    await taskCollection.updateOne({ _id: id }, { 
      $set: {
        remainingAttempts: remainingAttempts
      }
    })
    const task = await Task.findById(id)
    realtime.emit (task.taskGroupId + '', 'task:update', task)
    return task
  }

  // "Plucking" a task duplicates a the task into a new task group.
  // Useful for re-running a single task many times while debugging.
  static async pluckById(id: ObjectId) : Promise<Task> {
    const originalTask = await Task.findById(id)

    const group = await TaskGroup.fromData({
      name: 'Pluck Task ' + id,
      isPaused: true
    }) as TaskGroup

    if (!group || !group._id) {
      throw new Error('Failed to create task group!')
    }

    // Clone task into group
    const newTaskData = _.omit(originalTask, 
      [
        'taskGroupId', 'createdAt', 'errors', 'output', 'remainingAttempts', 'isPaused', 'parentsComplete', 'isComplete', 'runAfter', 'parentIds', 'assignedTo', 'assignedAt'
      ]
    )
    const task = await Task.fromData(group._id, newTaskData)
    // Return group
    return task
  }

  static async acquireInChannel(channel: string, workerId: string) : Promise<Task | null> {
    const { taskCollection } = await initDb()
    const now = DateTime.utc().toJSDate()
    const assignedAt = now
    const assignResult = await taskCollection.findOneAndUpdate(
      {
        channel,
        isComplete: false,
        isPaused: false,
        remainingAttempts: { $gt: 0 },
            assignedTo: null,
            $and: [
              {$or: [
                { runAfter: { $lt: now } },
                { runAfter: null }
              ]},
              {$or: [
                { parentsComplete: true },
                { parentIds : { $size: 0 } }
              ]}
            ]
      },
      { $set: { assignedTo: workerId, assignedAt } },
      { sort: { priority: -1, createdAt: 1 } }  // 1 = ascending, -1 = descending
    )

    if (!assignResult.value) {
      return null
    }
    const task = await Task.findById(assignResult.value._id)

    // Mark tasks with same key and channel as also in progress
    if (task.key) {
      await taskCollection.updateMany(
        { isComplete: false, channel: task.channel, key: task.key },
        { 
          $set: { assignedTo: workerId, assignedAt }
        }
      )
      realtime.emit (task.taskGroupId + '', 'task:acquire:key', {
        channel: task.channel,
        key: task.key,
        update: {
          assignedTo: workerId,
          assignedAt
        }
      })
    }

    realtime.emit (task.taskGroupId + '', 'task:update', task)
    return task
  }

  static async release(id: ObjectId, workerId: string, error: any = null, output: any = null, children: TaskChild[] = [], workgroupDelayInSeconds = 0) : Promise<Task> {
    const { taskCollection } = await initDb()
    const task = await Task.findById(id)
    if (!task) {
      throw new Error('Unable to find task!')
    }
    if (task.isComplete) {
      console.warn('~~ Received a call to release for a task that is already complete!')
      return task
    }
    if (task.assignedTo != workerId) {
      throw new Error('Worker id did not match!')
    }
    if (error) {
      const update: any = {
        assignedTo: null,
        assignedAt: null,
      }
      const runAfter = DateTime.utc().plus({ seconds: task.errorDelayInSeconds }).toJSDate()
      if (task.errorDelayInSeconds) {
        update.runAfter = runAfter
      }
      await taskCollection.updateOne(
        { _id: id },
        { 
          $set : update,
          $inc: {remainingAttempts: -1},
          $push: { errors: error }
        }
      )

      // release (with error) any incomplete tasks with same key in the same channel (duplication prevention)
      if (task.key) {
        await taskCollection.updateMany(
          { isComplete: false, channel: task.channel, key: task.key },
          { 
            $set : update,
            $inc: {remainingAttempts: -1},
            $push: { errors: error }
          }
        )
        realtime.emit (task.taskGroupId + '', 'task:release:key', {
          channel: task.channel,
          key: task.key,
          update: {
            assignedTo: null,
            assignedAt: null,
            error: error,
            isComplete: false,
            runAfter,
            remainingAttempts: task.remainingAttempts - 1
          }
        })
      }

    } else {
      
      // TODO - use a transaction here?
      // https://medium.com/@radheyg11/mongodb-transaction-with-node-js-b81618bebae8
      try {

        // Create children
        if (children && children.length > 0) {
          
          let pending: TaskChild[] = []
          for (const child of children) {
            if(!child._id) {
              pending.push(child)
            }
          }

          for (const child of pending) {
            let canCreate = false
            if (child._id) {
              // Skip children that have been created (this shouldn't happen unless we screw up the way that "pending" is populated)
              continue
            }

            // We can create children that are roots (no parent ids)
            if (!child._parent_ids) {
              // Override parent_ids with id of creator node (the node who's output we are processing)
              child.parentIds = [id]
              canCreate = true
            } else {
              // We can create children who's parents have been created
              const parentRealIds: ObjectId[] = []
              for (const parentId of child._parent_ids) {
                const found = _.find(children, (c) => { return c._child_id === parentId && _.has(c, '_id') });
                if (found && found._id) {
                  parentRealIds.push(found._id);
                }
              }

              if (parentRealIds.length === child._parent_ids.length) {
                child.parentIds = parentRealIds
                canCreate = true
              }
            }

            if (canCreate) {
              // Strip _id, and _parent_ids before using fromData
              const createData = _.cloneDeep(child)
              delete createData._child_id
              delete createData._parent_ids
              
              const childTask = await Task.fromData(task.taskGroupId, createData)

              child.taskGroupId = task.taskGroupId
              child._id = childTask._id
            }
          }

          const lastPendingCount = pending.length
          pending = []
          for (const child of children) {
            if(!child._id) {
              pending.push(child)
            }
          }

          if (lastPendingCount <= pending.length) {
            throw Error("spawnChildren pending count did not decrease on iteration - something is wrong!")
          }
        }

        // Mark task as complete
        await taskCollection.updateOne(
          { _id: id },
          { 
            $set : {
              assignedTo: null,
              assignedAt: null,
              output: output,
              isComplete: true,
              remainingAttempts: 0,
              runAfter: null
            }
          }
        )

      } catch (error) {
        // Remove any created children
        await taskCollection.deleteMany( {parentIds: {$in: [id]}} )
        throw error
      }

      // release any incomplete tasks with same key in the same channel (duplication prevention)
      if (task.key) {
        await taskCollection.updateMany(
          { isComplete: false, channel: task.channel, key: task.key },
          { 
            $set : {
              assignedTo: null,
              assignedAt: null,
              output: output,
              isComplete: true,
              runAfter: null,
              remainingAttempts: 0
            }
          }
        )
        realtime.emit (task.taskGroupId + '', 'task:release:key', {
          channel: task.channel,
          key: task.key,
          update: {
            assignedTo: null,
            assignedAt: null,
            output: output,
            isComplete: true,
            runAfter: null,
            remainingAttempts: 0
          }
        })
      }

      // Update parentsComplete in any children
      // Use simple random timer to prevent race here (when two parents complete at same moment)
      const randTimeout = Math.floor(Math.random() * 1000)
      await new Promise(resolve => setTimeout(resolve, randTimeout))
      const directChildren = await Task.findChildren(id)
      for (const child of directChildren) {
        await Task.syncParentsComplete(child)
      }
    }

    if (workgroupDelayInSeconds && task.workgroup) {
      const runAfter = DateTime.utc().plus({ seconds: workgroupDelayInSeconds }).toJSDate()
      await taskCollection.updateMany(
        { isComplete: false, workgroup: task.workgroup },
        { 
          $set: {
            runAfter
          }
        }
      )
      realtime.emit (task.taskGroupId + '', 'workgroup:delay', {
        workgroup: task.workgroup,
        update: {
          runAfter
        }
      })
    }

    const resultTask = await Task.findById(id)
    realtime.emit (task.taskGroupId + '', 'task:update', resultTask)
    return resultTask
  }

  static async syncParentsComplete(task: Task) : Promise<void> {
    const { taskCollection } = await initDb()
    if (task.parentsComplete) {
      return
    }
    let completedParentsCount = 0
    for (const parentId of task.parentIds) {
      const parent = await Task.findById(parentId)
      if (parent.isComplete) {
        completedParentsCount++
      }
    }
    if (completedParentsCount === task.parentIds.length) {
      await taskCollection.updateOne(
        { _id: task._id },
        { $set: {
          parentsComplete: true
        }}
      )
      task.parentsComplete = true
      realtime.emit (task.taskGroupId + '', 'task:update', task)
    }
  }

  static async getParentsData(task: Task) : Promise<any> {
    const parents = []
    for (const parentId of task.parentIds) {
      const parent = await Task.findById(parentId)
      if (parent) {
        parents.push({
          _id: parent._id,
          channel: parent.channel,
          input: parent.input,
          output: parent.output
        })
      }
    }
    return parents
  }

  static async syncParents() : Promise<number> {
    const { taskCollection } = await initDb()
    let updatedCount = 0
    // Find all tasks that may need parentsComplete sync'd

    const tasks = await taskCollection.find({
      parentIds : { $exists: true, $not: {$size: 0} },
      isComplete: false,
      parentsComplete: false,
      remainingAttempts: { $gt: 0 }}).toArray() as Task[]

    for (const task of tasks) {
      let allParentsAreComplete = true
      for (const parentId of task.parentIds) {
        const parent = await Task.findById(parentId)
        if (!parent.isComplete) {
          allParentsAreComplete = false
          break
        }
      }
      if (allParentsAreComplete) {
        await taskCollection.updateOne(
          { _id: task._id },
          { $set: { parentsComplete: true } }
        )
        updatedCount++
      }
    }
    return updatedCount
  }

  static async operatorAcquire(id: ObjectId, workerId: string) : Promise<Task | null> {
    const { taskCollection } = await initDb()
    const now = DateTime.utc().toJSDate()
    const assignedAt = now
    const assignedAtCutoff = DateTime.utc().minus({seconds: parseInt(process.env.CREW_ABANDONED_TASK_INTERVAL_IN_SECONDS || '60')}).toJSDate()

    const assignResult = await taskCollection.findOneAndUpdate(
      {
        _id: id,
        isComplete: false,
        isPaused: false,
        remainingAttempts: { $gt: 0 },

        // Can acquire if
        // assignedTo is null
        //   AND runAfter is null OR has passed
        //   AND parentsComplete is true or size 0
        // OR
        // assignedAt + CREW_ABANDONED_TASK_INTERVAL_IN_SECONDS seconds has passed (TODO refreshable lease based on assignedAt - if task exec can update own assignedAt?)
        //   AND runAfter is null OR has passed
        //   AND parentsComplete is true or size 0
        
        $or: [
          {$and: [{
            assignedTo: null,
            $and: [
              {$or: [
                { runAfter: { $lt: now } },
                { runAfter: null }
              ]},
              {$or: [
                { parentsComplete: true },
                { parentIds : { $size: 0 } }
              ]}
            ]
          }]},
          {$and: [{
            assignedAt: { $lt: assignedAtCutoff },
            $and: [
              {$or: [
                { runAfter: { $lt: now } },
                { runAfter: null }
              ]},
              {$or: [
                { parentsComplete: true },
                { parentIds : { $size: 0 } }
              ]}
            ]
          }]}
        ]
      },
      { $set: { assignedTo: workerId, assignedAt } },
      { sort: { priority: -1, createdAt: 1 } }  // 1 = ascending, -1 = descending
    )

    if (!assignResult.value) {
      return null
    }
    const task = await Task.findById(assignResult.value._id)

    // Mark tasks with same key and channel as also in progress
    if (task.key) {
      await taskCollection.updateMany(
        { isComplete: false, channel: task.channel, key: task.key },
        { 
          $set: { assignedTo: workerId, assignedAt }
        }
      )
      realtime.emit (task.taskGroupId + '', 'task:acquire:key', {
        channel: task.channel,
        key: task.key,
        update: {
          assignedTo: workerId,
          assignedAt
        }
      })
    }

    realtime.emit (task.taskGroupId + '', 'task:update', task)
    return task
  }

  static async examine(id: ObjectId) : Promise<any> {
    const { operatorCollection } = await initDb()
    const task = await Task.findById(id)
    const messenger = await getMessenger()
    
    // If task is
    // not complete,
    // not assigned,
    // has remaining attempts,
    // and has an operator for its channel
    // then publish an event on the execute message bus.

    let runAfterHasPassed = true
    let examineDelay = 0
    if (task.runAfter) {
      const now = new Date()

      if (now < task.runAfter) {
        runAfterHasPassed = false

        // re-publish examine with a delay that is after runAfter
        examineDelay = Math.ceil((task.runAfter.getTime() - now.getTime()) / 1000) + 1
      }
    }

    // console.log('~~ examine', !task.isPaused, !task.isComplete, (task.parentsComplete || task.parentIds.length === 0), task.remainingAttempts > 0, runAfterHasPassed)

    if (!task.isPaused && !task.isComplete && (task.parentsComplete || task.parentIds.length === 0) && task.remainingAttempts > 0 && runAfterHasPassed) {
      const operator = await operatorCollection.findOne({channel: task.channel}) as Operator
      if (operator || process.env.CREW_VIRTUAL_OPERATOR_BASE_URL) {
        await messenger.publishExecuteTask(id.toString())
      }
    } else if (examineDelay) {
      await messenger.publishExamineTask(id.toString(), examineDelay)
    }
  }
}

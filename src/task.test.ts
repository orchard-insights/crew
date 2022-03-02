jest.mock('./database')
jest.mock('./realtime')

import initDb from "./database"
import { Task } from "./Task"
import { TaskGroup } from "./TaskGroup"
import realtime from './realtime'
import uniqid from 'uniqid'

beforeEach(async () => {
  const { groupCollection, taskCollection } = await initDb()
  await groupCollection.deleteMany({})
  await taskCollection.deleteMany({})
})

afterAll(async () => {
  const { client, close } = await initDb()
  await client.close()
  await close()
})

// test('adds 1 + 2 to equal 3', () => {
//   expect(1 + 2).toBe(3)
// })

test('can create task group and task', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Test Group'
  })

  expect(group._id).not.toBeNull()
  expect(group._id).not.toBeUndefined()

  if (group._id) {
    const task = await Task.fromData(group._id, {
      name: 'You can do it',
      channel: 'test_a'
    })

    expect(task._id).not.toBeNull()
    expect(task._id).not.toBeUndefined()
  }

  expect(realtime.emit).toHaveBeenCalledTimes(2)
})

test('can update task', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Test Group'
  })

  if (!group || !group._id) {
    throw new Error('No group!')
  }

  const task = await Task.fromData(group._id, {
    name: 'Wrong task name',
    channel: 'test_a'
  })

  if (!task || !task._id) {
    throw new Error('No task!')
  }

  await Task.updateById(task._id, { name : 'Right task name'})

  const updated = await Task.findById(task._id)

  if (!updated || !updated._id) {
    throw new Error('No updated!')
  }

  expect(updated.name).toEqual('Right task name')
})

test('can acquire and complete task', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Test Group'
  })

  if (!group._id) {
    throw new Error('No group id')
  }

  const task = await Task.fromData(group._id, {
    name: 'You can do it',
    channel: 'test_a'
  })

  const workerId = uniqid()
  const acquired = await Task.acquireInChannel('test_a', workerId)

  if(!acquired || !acquired._id) {
    throw new Error('No acquired task!')
  }

  expect(acquired._id).toEqual(task._id)
  expect(acquired.assignedTo).toEqual(workerId)
  expect(acquired.assignedAt).not.toBeNull()

  const completed = await Task.release(acquired._id, workerId, null, { done: 'yes' })

  if(!completed || !completed._id) {
    throw new Error('No completed task!')
  }

  expect(completed.isComplete).toBeTruthy()
  expect((completed.output as any).done).toEqual('yes')
})

test('new node is paused in paused group', async () => {
  const group = await TaskGroup.fromData({
    name: 'Paused Group',
    isPaused: true
  })

  if (!group || !group._id) {
    throw new Error('No group')
  }

  expect(group.isPaused).toBeTruthy()

  const task = await Task.fromData(group._id, {
    name: 'I should be paused too',
    channel: 'test_a'
  })

  if (!task || !task._id) {
    throw new Error('No task')
  }

  expect(task.isPaused).toBeTruthy()
})

test('can acquire and complete task with an error', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Error Group'
  })

  if (!group || !group._id) {
    throw new Error('No group id')
  }

  const task = await Task.fromData(group._id, {
    name: 'You can do it',
    channel: 'test_a',
    errorDelayInSeconds: 0
  })

  const workerId = uniqid()
  const acquired = await Task.acquireInChannel('test_a', workerId)

  if(!acquired || !acquired._id) {
    throw new Error('No acquired task!')
  }

  expect(acquired._id).toEqual(task._id)
  expect(acquired.assignedTo).toEqual(workerId)
  expect(acquired.assignedAt).not.toBeNull()

  const errored = await Task.release(acquired._id, workerId, { oops: 'I died' })

  if(!errored || !errored._id) {
    throw new Error('No errored task!')
  }

  expect(errored.isComplete).toBeFalsy()
  expect(errored.remainingAttempts).toEqual(4)
  expect(errored.errors).toHaveLength(1)

  const acquiredAfterError = await Task.acquireInChannel('test_a', workerId)

  if(!acquiredAfterError || !acquiredAfterError._id) {
    throw new Error('No acquiredAfterError task!')
  }

  expect(acquiredAfterError._id).toEqual(task._id)
  expect(acquiredAfterError.assignedTo).toEqual(workerId)
  expect(acquiredAfterError.assignedAt).not.toBeNull()
})

test('can reset task', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Reset Group'
  })

  if (!group || !group._id) {
    throw new Error('No group!')
  }

  const completedTask = await Task.fromData(group._id, {
    name: 'I am the seed',
    isSeed: true,
    channel: 'completed'
  })

  if (!completedTask || !completedTask._id) {
    throw new Error('No completed task')
  }

  const { taskCollection } = await initDb()

  await taskCollection.updateOne(
    { _id: completedTask._id },
    { $set: {
      assignedTo: null,
      assignedAt: null,
      output: { done: 'yes' },
      isComplete: true,
      remainingAttempts: 0,
      runAfter: null
    }}
  )
  
  await Task.resetById(completedTask._id, 2)

  const resetTask = await Task.findById(completedTask._id)

  expect(resetTask._id).toEqual(completedTask._id)
  expect(resetTask.isComplete).toBeFalsy()
  expect(resetTask.remainingAttempts).toEqual(2)
})

test('can retry task', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Retry Group'
  })

  if (!group || !group._id) {
    throw new Error('No group!')
  }

  const failedTask = await Task.fromData(group._id, {
    name: 'I need to be retried',
    channel: 'retry'
  })

  if (!failedTask || !failedTask._id) {
    throw new Error('No completed task')
  }

  const { taskCollection } = await initDb()

  await taskCollection.updateOne(
    { _id: failedTask._id },
    { $set: {
      errors: [{ oops: 'I died' }],
      remainingAttempts: 0,
    }}
  )
  
  await Task.retryById(failedTask._id, 3)

  const retriedTask = await Task.findById(failedTask._id)

  expect(retriedTask._id).toEqual(failedTask._id)
  expect(retriedTask.isComplete).toBeFalsy()
  expect(retriedTask.remainingAttempts).toEqual(3)
})

test('can complete with children', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Test Group'
  })

  if (!group._id) {
    throw new Error('No group id')
  }

  const task = await Task.fromData(group._id, {
    name: 'You can do it',
    channel: 'test_a'
  })

  const workerId = uniqid()
  const acquired = await Task.acquireInChannel('test_a', workerId)

  if(!acquired || !acquired._id) {
    throw new Error('No acquired task!')
  }

  expect(acquired._id).toEqual(task._id)
  expect(acquired.assignedTo).toEqual(workerId)
  expect(acquired.assignedAt).not.toBeNull()

  const completed = await Task.release(acquired._id, workerId, null, { done: 'yep!' }, [
    {
      _child_id: 0,
      name: 'Continuation Child A',
      channel: 'continuation',
      input: { foo: 'bar '}
    },
    {
      _child_id: 1,
      _parent_ids: [0],
      name: 'Continuation Grandchild B',
      channel: 'continuation',
      input: { foo: 'baz '}
    }
  ])

  if(!completed || !completed._id) {
    throw new Error('No completed task!')
  }

  expect(completed.isComplete).toBeTruthy()
  expect((completed.output as any).done).toEqual('yep!')

  const tasks = await Task.findAllInGroup(group._id)

  expect(tasks).toHaveLength(3)

  // We should get parent output when acquiring next item

  const acquiredChild = await Task.acquireInChannel('continuation', workerId)
  
  if(!acquiredChild || !acquiredChild._id) {
    throw new Error('No acquiredChild task!')
  }

  expect(acquiredChild.name).toEqual('Continuation Child A')

  const parents = await Task.getParentsData(acquiredChild)

  expect(parents).toHaveLength(1)

  expect(parents[0]._id).toEqual(acquired._id)
  expect(parents[0].output.done).toEqual('yep!')
})

/*
A, the seed node creates a continuation that forms a DAG diamond.
Task E should not be executed till C and D are completed

    A
    |
    B
   / \
  C   D
   \ /
    E
*/
test('can complete with dag children', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'DAG Group'
  })

  if (!group._id) {
    throw new Error('No group id')
  }

  const task = await Task.fromData(group._id, {
    name: 'Task A',
    isSeed: true,
    channel: 'dag'
  })

  const workerId = uniqid()
  const acquired = await Task.acquireInChannel('dag', workerId)

  if(!acquired || !acquired._id) {
    throw new Error('No acquired task!')
  }

  const completed = await Task.release(acquired._id, workerId, null, { done: 'yep!' }, [
    {
      _child_id: 0,
      name: 'Task B',
      channel: 'dag',
      input: { foo: 'bar '}
    },
    {
      _child_id: 1,
      _parent_ids: [0],
      name: 'Task C',
      priority: 1, // Ensures C gets worked first
      channel: 'dag',
      input: { foo: 'baz '}
    },
    {
      _child_id: 2,
      _parent_ids: [0],
      name: 'Task D',
      priority: 0,
      channel: 'dag',
      input: { ding: 'dong' }
    },
    {
      _child_id: 3,
      _parent_ids: [1, 2],
      name: 'Task E',
      channel: 'dag',
      input: { whoa: 'there' }
    }
  ])

  if(!completed || !completed._id) {
    throw new Error('No completed task!')
  }

  const acquireB = await Task.acquireInChannel('dag', workerId)
  if (!acquireB || !acquireB._id) {
    throw new Error('No acquireB')
  }
  expect(acquireB.name).toEqual('Task B')
  await Task.release(acquireB._id, workerId, null, { done : 'B' })

  const acquireC = await Task.acquireInChannel('dag', workerId)
  if (!acquireC || !acquireC._id) {
    throw new Error('No acquireC')
  }
  expect(acquireC.name).toEqual('Task C')
  await Task.release(acquireC._id, workerId, null, { done : 'C' })

  const acquireD = await Task.acquireInChannel('dag', workerId)
  if (!acquireD || !acquireD._id) {
    throw new Error('No acquireD')
  }
  expect(acquireD.name).toEqual('Task D')
  await Task.release(acquireD._id, workerId, null, { done : 'D' })

  const acquireE = await Task.acquireInChannel('dag', workerId)
  if (!acquireE || !acquireE._id) {
    throw new Error('No acquireE')
  }
  expect(acquireE.name).toEqual('Task E')
  await Task.release(acquireE._id, workerId, null, { done : 'E' })

  const tasks = await Task.findAllInGroup(group._id)

  expect(tasks).toHaveLength(5)

  for (const task of tasks) {
    expect(task.isComplete).toBeTruthy()
  }
})

test('can complete task with workgroup delay', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Test Group'
  })

  if (!group._id) {
    throw new Error('No group id')
  }

  const task = await Task.fromData(group._id, {
    name: 'Over the limit',
    workgroup: 'rateLimitMe',
    channel: 'test_a'
  })

  const taskA = await Task.fromData(group._id, {
    name: 'In Workgroup A',
    workgroup: 'rateLimitMe',
    channel: 'test_a'
  })

  const taskB = await Task.fromData(group._id, {
    name: 'In Workgroup B',
    workgroup: 'rateLimitMe',
    channel: 'test_b'
  })

  const workerId = uniqid()
  const acquired = await Task.acquireInChannel('test_a', workerId)

  if(!acquired || !acquired._id) {
    throw new Error('No acquired task!')
  }
  if(!taskA || !taskA._id) {
    throw new Error('No taskA task!')
  }
  if(!taskB || !taskB._id) {
    throw new Error('No taskB task!')
  }

  const timestamp = new Date().getTime()

  await Task.release(acquired._id, workerId, null, { delay: 'me' }, [], 35)

  const taskADelayed = await Task.findById(taskA._id)
  const taskBDelayed = await Task.findById(taskB._id)

  if(!taskADelayed || !taskADelayed._id) {
    throw new Error('No taskADelayed task!')
  }
  if(!taskBDelayed || !taskBDelayed._id) {
    throw new Error('No taskBDelayed task!')
  }

  expect(taskADelayed.runAfter).toBeDefined()
  expect(taskBDelayed.runAfter).toBeDefined()
  expect(taskADelayed.runAfter?.getTime()).toBeGreaterThan(timestamp)
  expect(taskBDelayed.runAfter?.getTime()).toBeGreaterThan(timestamp)
})

test('sync parents complete', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Out of Sync Parents Group'
  })

  if (!group._id) {
    throw new Error('No group id')
  }

  const taskA = await Task.fromData(group._id, {
    name: 'Task A',
    isSeed: true,
    channel: 'dag'
  })

  if (!taskA._id) {
    throw new Error('No taskA id')
  }

  const { taskCollection } = await initDb()

  await taskCollection.updateOne(
    { _id: taskA._id },
    { $set: {
      assignedTo: null,
      assignedAt: null,
      output: { done: 'yes' },
      isComplete: true,
      remainingAttempts: 0,
      runAfter: null
    }}
  )

  const taskB = await Task.fromData(group._id, {
    name: 'Task A',
    isSeed: true,
    channel: 'dag',
    parentIds: [taskA._id + '']
  })

  if (!taskB._id) {
    throw new Error('No taskB id')
  }

  await taskCollection.updateOne(
    { _id: taskB._id },
    { $set: {
      parentsComplete: false
    }}
  )

  const count = await Task.syncParents()

  expect(count).toEqual(1)

  const refreshTaskB = await Task.findById(taskB._id)

  if (!refreshTaskB._id) {
    throw new Error('No refreshTaskB id')
  }

  expect(refreshTaskB.parentsComplete).toBeTruthy()
})

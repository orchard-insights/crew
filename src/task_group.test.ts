jest.mock('./database')
jest.mock('./realtime')

import initDb from "./database"
import { Task } from "./Task"
import { TaskGroup } from "./TaskGroup"
import realtime from './realtime'

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

test('can update group', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Wrong Name'
  })

  if (!group || !group._id) {
    throw new Error('No group!')
  }

  await TaskGroup.updateById(group._id, { name : 'Right Name'})

  const updated = await TaskGroup.findById(group._id)

  if (!updated || !updated._id) {
    throw new Error('No updated!')
  }

  expect(updated.name).toEqual('Right Name')
})

test('can pause and unpause group', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Test Group'
  })

  if (!group || !group._id) {
    throw new Error('No group!')
  }

  expect(group.isPaused).toBeFalsy()

  await Task.fromData(group._id, {
    name: 'I am not paused',
    channel: 'test_a'
  })

  await Task.fromData(group._id, {
    name: 'Neither am I',
    channel: 'test_a'
  })

  const paused = await TaskGroup.syncPauseById(group._id, true)

  if (!paused || !paused._id) {
    throw new Error('No paused!')
  }

  expect(paused.isPaused).toBeTruthy()

  const pausedTasks = await Task.findAllInGroup(paused._id)

  expect(pausedTasks).toHaveLength(2)

  for (const task of pausedTasks) {
    expect(task.isPaused).toBeTruthy()
  }

  const unpaused = await TaskGroup.syncPauseById(group._id, false)

  if (!unpaused || !unpaused._id) {
    throw new Error('No unpaused!')
  }

  expect(unpaused.isPaused).toBeFalsy()

  const unpausedTasks = await Task.findAllInGroup(unpaused._id)

  expect(unpausedTasks).toHaveLength(2)

  for (const task of unpausedTasks) {
    expect(task.isPaused).toBeFalsy()
  }
})

test('can reset group - no seed', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Reset Group'
  })

  if (!group || !group._id) {
    throw new Error('No group!')
  }

  const completedTask = await Task.fromData(group._id, {
    name: 'I am completed',
    channel: 'completed'
  })

  if (!completedTask || !completedTask._id) {
    throw new Error('No completed task')
  }

  await Task.fromData(group._id, {
    name: 'I am not completed',
    channel: 'not_completed'
  })

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
  
  await TaskGroup.resetById(group._id, 2)

  const resetTasks = await Task.findAllInGroup(group._id)

  expect(resetTasks).toHaveLength(2)

  for (const task of resetTasks) {
    expect(task.isComplete).toBeFalsy()
    expect(task.remainingAttempts).toEqual(2)
  }
})

test('can reset group - with seed', async () => {
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

  await Task.fromData(group._id, {
    name: 'I am not completed nor a seed',
    channel: 'not_completed'
  })

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
  
  await TaskGroup.resetById(group._id, 2)

  const resetTasks = await Task.findAllInGroup(group._id)

  expect(resetTasks).toHaveLength(1)

  expect(resetTasks[0]._id).toEqual(completedTask._id)
  expect(resetTasks[0].isComplete).toBeFalsy()
  expect(resetTasks[0].remainingAttempts).toEqual(2)
})

test('can retry group', async () => {
  realtime.emit = jest.fn()

  const group = await TaskGroup.fromData({
    name: 'Retry Group'
  })

  if (!group || !group._id) {
    throw new Error('No group!')
  }

  const completedTask = await Task.fromData(group._id, {
    name: 'I am the seed',
    channel: 'completed'
  })

  if (!completedTask || !completedTask._id) {
    throw new Error('No completed task')
  }

  const incompleteTask = await Task.fromData(group._id, {
    name: 'I am not completed',
    channel: 'not_completed'
  })

  if (!incompleteTask || !incompleteTask) {
    throw new Error('No incomplete task')
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

  await taskCollection.updateOne(
    { _id: incompleteTask._id },
    { $set: {
      remainingAttempts: 0,
    }}
  )
  
  await TaskGroup.retryById(group._id, 2)

  const completedTasks = await taskCollection.find({ taskGroupId: group._id, isComplete: true }).toArray()
  const incompletedTasks = await taskCollection.find({ taskGroupId: group._id, isComplete: false }).toArray()

  expect(completedTasks).toHaveLength(1)
  expect(incompletedTasks).toHaveLength(1)

  expect(completedTasks[0].isComplete).toBeTruthy()

  expect(incompletedTasks[0].isComplete).toBeFalsy()
  expect(incompletedTasks[0].remainingAttempts).toEqual(2)
})

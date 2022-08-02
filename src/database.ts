import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb'
import CrewDatabase from './CrewDatabase'
import { getMessenger } from './CloudTasks'

let crewDb: CrewDatabase | null = null

// Async init function is used to help mock mongodb for functional tests
export default async function initDb () : Promise<CrewDatabase> {
  if (crewDb) {
    return crewDb
  }

  // Initialize mongodb
  let uri = process.env.CREW_MONGO_URI || 'MEMORY' // mongodb://localhost:27017/?readPreference=primary&ssl=false'
  let mongod: MongoMemoryServer | null = null
  if (uri === 'MEMORY') {
    mongod = await MongoMemoryServer.create();

    // Initialize mongodb
    uri = mongod.getUri();
  }
  const client = new MongoClient(uri)
  const db = client.db(process.env.CREW_MONGO_DB || 'orchard-crew')
  await client.connect()

  // Ensure collections exist
  const collections = await db.listCollections().toArray()
  let shouldCreateTaskGroupsCollection = true
  let shouldCreateTasksCollection = true
  let shouldCreateOperatorsCollection = true
  for (const collection of collections) {
    if (collection.name == 'task_group') {
      shouldCreateTaskGroupsCollection = false
    }
    if (collection.name == 'task') {
      shouldCreateTasksCollection = false
    }
    if (collection.name == 'operator') {
      shouldCreateOperatorsCollection = false
    }
  }

  if (shouldCreateTaskGroupsCollection) {
    console.log('~~ Creating Collection : task_group')
    await db.createCollection('task_group')
  } else {
    console.log('~~ Collection Exists : task_group')
  }
  if (shouldCreateTasksCollection) {
    console.log('~~ Creating Collection : task')
    await db.createCollection('task')
  } else {
    console.log('~~ Collection Exists : task')
  }
  if (shouldCreateOperatorsCollection) {
    console.log('~~ Creating Collection : operator')
    await db.createCollection('operator')
  } else {
    console.log('~~ Collection Exists : operator')
  }
  
  const groupCollection = db.collection('task_group')
  const taskCollection = db.collection('task')
  const operatorCollection = db.collection('operator')

  const tasksChangeStream = taskCollection.watch()
  const messenger = await getMessenger()
  tasksChangeStream.on('change', (change) => {
    if (change.documentKey) {
      if (change.operationType === 'update' || change.operationType === 'insert') {
        // console.log('~~ Task Change', change.operationType, (change.documentKey as any)._id)
        if (change.documentKey && (change.documentKey as any)._id) {
          messenger.publishExamineTask((change.documentKey as any)._id, 0)
        }
      }
    }
  })

  // Ensure indexes exist
  const taskIndexes = [{
      name: 'idxChannel',
      fields: {channel:  1}
    },
    {
      name: 'idxIsComplete',
      fields: {isComplete:  1}
    },
    {
      name: 'idxTaskGroupId',
      fields: {taskGroupId:  1}
    },
    {
      name: 'idxKey',
      fields: {key:  1}
    },
    {
      name: 'idxCreatedAt',
      fields: {createdAt:  1}
    },
    {
      name: 'idxPriority',
      fields: {priority:  -1}
    },
    {
      name: 'idxAcquire',
      fields: {
        channel: 1,
        isComplete: 1,
        isPaused: 1,
        remainingAttempts: 1,
        assignedTo: 1,
        runAfter: 1,
        parentsComplete: 1,
        parentIds : 1,
        priority: -1,
        createdAt: 1,
      }
    }
  ]

  for (const index of taskIndexes) {
    const idxExists = await taskCollection.indexExists(index.name)
    if (!idxExists) {
      console.log(`~~ Creating Index : ${index.name}`)
      await taskCollection.createIndex(index.fields as any, { name: index.name })
    } else {
      console.log(`~~ Index Exists : ${index.name}`)
    }
  }

  crewDb = {
    client,
    db,
    groupCollection,
    taskCollection,
    operatorCollection,
    async close () {
      if (mongod) {
        await mongod.stop()
      }
      await client.close()
    }
  }

  return crewDb
}

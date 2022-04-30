import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb'
import CrewDatabase from '../CrewDatabase'

let crewDb: CrewDatabase | null = null

// The Server can be stopped again with
// await mongod.stop();

export default async function initDb () : Promise<CrewDatabase> {
  if (crewDb) {
    return crewDb
  }

  // This will create an new instance of "MongoMemoryServer" and automatically start it
  const mongod = await MongoMemoryServer.create();

  // Initialize mongodb
  const uri = mongod.getUri();
  const client = new MongoClient(uri)
  const db = client.db(process.env.CREW_MONGO_DB || 'orchard-crew')
  const groupCollection = db.collection('task_group')
  const taskCollection = db.collection('task')
  const operatorCollection = db.collection('operator')

  await client.connect()

  crewDb = {
    client,
    db,
    groupCollection,
    taskCollection,
    operatorCollection,
    async close () {
      await mongod.stop()
    }
  }

  return crewDb
}

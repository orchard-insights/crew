import { Collection, Db, MongoClient } from 'mongodb'

export default interface CrewDatabase {
  client: MongoClient,
  db: Db,
  groupCollection: Collection,
  taskCollection: Collection,
  operatorCollection: Collection,
  close: () => void
}

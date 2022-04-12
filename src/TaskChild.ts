import { ObjectId } from "mongodb"

// When a task returns a continuation, each child must follow this interface
export default interface TaskChild {
  _id?: ObjectId         // Will be defined after child is created
  taskGroupId?: ObjectId // Will be defined after child is created
  _child_id?: number,
  _parent_ids?: number[],
  name: string
  channel: string
  workgroup?: string | null
  input?: object | null
  remainingAttempts?: number
  priority?: number
  runAfter?: Date | null
  progressWeight?: number
  isSeed?: boolean
  key?: string | null
  parentIds?: ObjectId[]
  isPaused?: boolean
}

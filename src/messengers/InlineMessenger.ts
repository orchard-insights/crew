import Operator from "../Operator"
import Task from "../Task"
import { ObjectId } from "mongodb"
import Messenger from '../Messenger';

export default class InlineMessenger implements Messenger {
  async publishExamineTask(taskId: string, delayInSeconds: number) : Promise<any> {
    setTimeout(() => {
      Task.examine(new ObjectId(taskId))
    }, delayInSeconds * 1000)
  }

  async publishExecuteTask(taskId: string) : Promise<any> {
    Operator.execute(new ObjectId(taskId))
  }
}

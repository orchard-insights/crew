import Worker from '../../src/Worker'
import TaskResponse from '../../src/TaskResponse'

// This worker is here as an example, and for testing only - do not deploy

export default class WorkerA extends Worker {
  name = "Worker A"
  channel = "worker_a"

  public async executeTask (data: any): Promise<TaskResponse> {
    if (data && data.throw) {
      throw new Error(data.throw)
    } else {
      await new Promise((resolve, reject) => {setTimeout(resolve, 10000)})
      return {output: {"message": "Worker A did it!", "at": new Date() + ''}}
    }
  }

  override async prepare(): Promise<void> {
    console.log("Worker A custom prepare called!")
    return Promise.resolve()
  }

  override async cleanup(): Promise<void> {
    console.log("Worker A custom cleanup called!")
    return Promise.resolve()
  }
}

import Worker from '../../src/Worker'
import TaskResponse from '../../src/TaskResponse'

// This worker is here as an example, and for testing only - do not deploy

export default class WorkerB extends Worker {
  name = "Worker B"
  channel = "worker_b"

  public async executeTask (data: any): Promise<TaskResponse> {
    if (data && data.throw) {
      throw new Error(data.throw)
    } else {
      await new Promise((resolve, reject) => {setTimeout(resolve, 2000)})
      return {output: {"message": "Worker B did it!", "at": new Date() + ''}}
    }
  }
}

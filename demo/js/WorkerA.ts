import Worker from '../../src/Worker'
import { JobResponse } from '../../src/Worker'

// This worker is here as an example, and for testing only - do not deploy

export default class WorkerA extends Worker {
  name = "Worker A"
  channel = "worker_a"

  public async executeJob (data: any): Promise<JobResponse> {
    if (data && data.throw) {
      throw new Error(data.throw)
    } else {
      await new Promise((resolve, reject) => {setTimeout(resolve, 10000)})
      return {output: {"message": "Worker A did it!", "at": new Date() + ''}}
    }
  }

  public async cleanup () {
    console.log(`Nothing to cleanup for worker ${this.name} (${this.id})`)
  }

  public async isHealthy () {
    return true
  }
}

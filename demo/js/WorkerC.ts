import Worker from '../../src/Worker'
import TaskResponse from '../../src/TaskResponse'

// This worker is here as an example, and for testing only - do not deploy

export default class WorkerC extends Worker {
  name = "Worker \' C"
  channel = "worker_c"

  public async executeTask (data: any): Promise<TaskResponse> {
    if (data && data.throw) {
      throw new Error(data.throw)
    } else {
      await new Promise((resolve, reject) => {setTimeout(resolve, 2000)})
      return {output: {message: "Worker C \' did it!"}, children: [
          {
            _child_id: 1,
            channel: 'worker_a',
            input: {'child': 'A'},
            key: 'same_key',
            name: 'Child A'
          },
          {
            _child_id: 2,
            _parent_ids: [1],
            channel: 'worker_a',
            input: {'child': 'B'},
            key: 'same_key',
            name: 'Child B'
          },
          {
            _child_id: 3,
            _parent_ids: [1],
            channel: 'worker_b',
            input: {'child': 'C'},
            name: 'Child C'
          },
          {
            _child_id: 4,
            _parent_ids: [2, 3],
            channel: 'worker_a',
            input: {'child': "D oh' no a single quote! And a double quote \" too!"},
            //input: {'child': "D"},
            name: 'Child \' " D Quotes'
          }
        ]
      }
    }
  }
}

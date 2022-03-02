import time
from datetime import datetime
from Worker import Worker, WorkerOutput

class WorkerC(Worker):
  def __init__(self):
    super().__init__()
    self.name = "Worker \' C"
    self.channel = "worker_c"

  def execute_job (self, input : map, parents : map) -> WorkerOutput:
    if "throw" in input:
      raise Exception(input["throw"])
    else:
      time.sleep(2)
      children = [
        {
          "_child_id": 1,
          "channel": 'worker_a',
          "input": {'child': 'A'},
          "key": 'same_key',
          "name": 'Child A'
        },
        {
          "_child_id": 2,
          "_parent_ids": [1],
          "channel": 'worker_a',
          "input": {'child': 'B'},
          "key": 'same_key',
          "name": 'Child B'
        },
        {
          "_child_id": 3,
          "_parent_ids": [1],
          "channel": 'worker_b',
          "input": {'child': 'C'},
          "name": 'Child C'
        },
        {
          "_child_id": 4,
          "_parent_ids": [2, 3],
          "channel": 'worker_a',
          "input": {'child': "D oh' no a single quote! And a double quote \" too!"},
          "name": 'Child \' " D Quotes'
        }
      ]
      return WorkerOutput(children=children, output={"message": "Worker A did it!", "at": str(datetime.now()) })

  def cleanup (self):
    print("Nothing to cleanup for worker " + self.name + " (" + self.id + ")")

  def is_healthy(self):
    return True

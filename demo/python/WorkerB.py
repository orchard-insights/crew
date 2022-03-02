import time
from datetime import datetime
from Worker import Worker, WorkerOutput

class WorkerB(Worker):
  def __init__(self):
    super().__init__()
    self.name = "Worker B"
    self.channel = "worker_b"

  def execute_job (self, input : map, parents : map) -> WorkerOutput:
    if "throw" in input:
      print("~~ Worker B Throw!")
      raise Exception(input["throw"])
    else:
      time.sleep(2)
      return WorkerOutput(output={"message": "Worker A did it!", "at": str(datetime.now()) })

  def cleanup (self):
    print("Nothing to cleanup for worker " + self.name + " (" + self.id + ")")

  def is_healthy(self):
    return True

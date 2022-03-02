import time
from datetime import datetime
from Worker import Worker, WorkerOutput

class WorkerA(Worker):
  def __init__(self):
    super().__init__()
    self.name = "Worker A"
    self.channel = "worker_a"

  def execute_job (self, input : map, parents : map) -> WorkerOutput:
    time.sleep(10)
    return WorkerOutput(output={"message": "Worker A did it!", "at": str(datetime.now()) })

  def cleanup (self):
    print("Nothing to cleanup for worker " + self.name + " (" + self.id + ")")

  def is_healthy(self):
    return True

import threading
import signal
from Worker import Worker

# Custom thread implementation that runs a worker
class WorkerThread (threading.Thread):
  def __init__(self, worker):
    threading.Thread.__init__(self)
    self.worker = worker

  def run(self):
    self.worker.start_work()

# A group of multiple workers - each run in their own thread
class WorkerGroup:
  def __init__(self, workers: list[Worker]):
    self.workers = workers
    self.threads = []

    # Gracefully shut down on sigint
    signal.signal(signal.SIGINT, self.stopWorkers)

    # Start each worker thread
    for worker in self.workers:
      thread = WorkerThread(worker)
      self.threads.append(thread)
      thread.start()

  # Gracefully shut down each worker
  def stopWorkers(self, sig, frame):
    print("~~ Shutting down workers...")
    for worker in self.workers:
      worker.shutting_down = True

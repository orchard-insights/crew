import os
import uuid
import time
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

class WorkerOutput:
  def __init__(self, output={}, children=[]):
    self.output = output
    self.children = children

class Worker:
  def __init__(self):
    print("~~ Worker Init")
    # A unique id for the worker
    self.id = str(uuid.uuid4())

    #Crew api url and credentials
    self.api_base_url = os.getenv('CREW_API_BASE_URL', 'http://localhost:3000/')

    # Setup requests adapter to auto-retry job release requests
    retry_strategy = Retry(
      total=4,
      backoff_factor=5
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    http = requests.Session()
    http.mount(self.api_base_url, adapter)
    self.http = http

    # The currently assigned task
    self.task = None
    
    # Subclasses should set this to the desired delay when they encounter rate limit responses or errors
    self.pause_workgroup_seconds = 0

    # True when the worker has been asked to shutdown and no new tasks should be acquired
    self.shutting_down = False

    # How long should the worker wait before polling for new tasks
    self.work_interval_delay = int(os.getenv('CREW_WORK_INTERVAL_IN_MILLISECONDS', '15000'))

    # When true the worker will look for a new task immediately after finishing a task
    # This helps drain work queues faster but may not be desirable in rate limited workflows
    self.worker_interval_restart = (os.getenv('CREW_WORK_INTERVAL_RESTART', 'yes')) == 'yes'

  # Subclasses implement this method to cleanup any resources they use (database connections)
  def cleanup (self):
    pass

  # Subclasses implement this method to do their thing
  def execute_job (self, input : map, parents : map) -> WorkerOutput:
    pass

  # Let worker group know if we are healthy or not
  def is_healthy (self):
    pass

  # Start cycle of look for work / perform work
  def start_work(self):
    self.shutting_down = False
    while not self.shutting_down:
      restart = True
      while restart and not self.shutting_down:
        try:
          restart = self.do_work()
        except requests.exceptions.RequestException as e:
          print("Work loop requests error!", str(e))
          restart = False
        except Exception as e:
          print("Work loop error!", str(e))
          restart = False
      # CREW_WORK_INTERVAL_IN_MILLISECONDS is in ms for JS example, so divide by 1000 for python
      time.sleep(self.work_interval_delay / 1000)

  def stop_work(self):
    self.shutting_down = True
    print("~~ ", self.channel, " ", self.id, " stopWork")

  def do_work (self) -> bool:
    print("~~ ", self.channel, " ", self.id, " asking for task")

    # Call to acquire
    r = requests.post(self.api_base_url + "api/v1/channel/" + self.channel + "/acquire", json={"workerId": self.id})
    data = r.json()

    if "task" in data and data["task"] is not None:
      print("~~ ", self.channel, " ", self.id, " acquired task")
      self.pause_workgroup_seconds = 0
      self.task = data["task"]
      try:
        # Execute the work (in subclass) and get output
        output = self.execute_job(self.task.get("input", {}), self.task.get("parents", []))
        release_data = {
          "workerId": self.id,
          "output": output.output,
          "children": output.children
        }
        if self.pause_workgroup_seconds > 0:
          release_data["workgroupDelayInSeconds"] = self.pause_workgroup_seconds

        # Release the task that was being executed
        print("~~ ", self.channel, " ", self.id, " releasing task")
        # Note that we have automatic retries configured above
        r = self.http.post(self.api_base_url + "api/v1/task/" + self.task["_id"] + "/release", json=release_data)

        self.task = None
        return True

      except Exception as e:
        # There was an error in the worker when executing the task
        release_data = {
          "workerId": self.id,
          "error": str(e)
        }
        if self.pause_workgroup_seconds > 0:
          release_data["workgroupDelayInSeconds"] = self.pause_workgroup_seconds

        # Release the task with the error information
        print("~~ ", self.channel, " ", self.id, " releasing task")
        # Note that we have automatic retries configured above
        r = self.http.post(self.api_base_url + "api/v1/task/" + self.task["_id"] + "/release", json=release_data)

        self.task = None

        return False

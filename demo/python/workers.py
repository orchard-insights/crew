from WorkerGroup import WorkerGroup
from WorkerA import WorkerA
from WorkerB import WorkerB
from WorkerC import WorkerC

# Running multiple workers
WorkerGroup([WorkerA(), WorkerB(), WorkerC()])

# Running a single worker
# worker = WorkerA()
# worker.start_work()
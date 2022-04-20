/// <reference types="node" />
import Worker from './Worker';
import WorkerServerInterface from './WorkerServerInterface';
export default class WorkerGroup {
    server: WorkerServerInterface | null;
    workers: Worker[];
    shuttingDown: boolean;
    killTimeout: NodeJS.Timeout | null;
    constructor(workers?: Worker[], workerServer?: WorkerServerInterface | null);
    addWorker(worker: Worker): void;
    removeWorker(worker: Worker): Promise<void>;
    startShutdown(): Promise<void>;
}
//# sourceMappingURL=WorkerGroup.d.ts.map
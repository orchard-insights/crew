/// <reference types="node" />
import HttpWorker from './HttpWorker';
import WorkerServerInterface from './WorkerServerInterface';
export default class HttpWorkerGroup {
    server: WorkerServerInterface | null;
    workers: HttpWorker[];
    shuttingDown: boolean;
    killTimeout: NodeJS.Timeout | null;
    constructor(workers?: HttpWorker[], workerServer?: WorkerServerInterface | null);
    addWorker(worker: HttpWorker): void;
    removeWorker(worker: HttpWorker): Promise<void>;
    startShutdown(): Promise<void>;
}
//# sourceMappingURL=HttpWorkerGroup.d.ts.map
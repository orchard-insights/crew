/// <reference types="node" />
import Worker from './Worker';
import WorkerServer from './WorkerServer';
export default class WorkerGroup {
    server: WorkerServer | null;
    workers: Worker[];
    shuttingDown: boolean;
    killTimeout: NodeJS.Timeout | null;
    constructor(workers: Worker[]);
    startShutdown(): Promise<void>;
}
//# sourceMappingURL=WorkerGroup.d.ts.map
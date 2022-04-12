import Worker from '../../src/Worker';
import TaskResponse from '../../src/TaskResponse';
export default class WorkerB extends Worker {
    name: string;
    channel: string;
    executeTask(data: any): Promise<TaskResponse>;
    cleanup(): Promise<void>;
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=WorkerB.d.ts.map
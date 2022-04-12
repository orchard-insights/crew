import Worker from '../../src/Worker';
import TaskResponse from '../../src/TaskResponse';
export default class WorkerA extends Worker {
    name: string;
    channel: string;
    executeTask(data: any): Promise<TaskResponse>;
    cleanup(): Promise<void>;
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=WorkerA.d.ts.map
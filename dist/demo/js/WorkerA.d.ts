import Worker from '../../src/Worker';
import TaskResponse from '../../src/TaskResponse';
export default class WorkerA extends Worker {
    name: string;
    channel: string;
    executeTask(data: any): Promise<TaskResponse>;
    prepare(): Promise<void>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=WorkerA.d.ts.map
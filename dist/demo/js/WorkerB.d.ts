import Worker from '../../src/Worker';
import TaskResponse from '../../src/TaskResponse';
export default class WorkerB extends Worker {
    name: string;
    channel: string;
    executeTask(data: any): Promise<TaskResponse>;
}
//# sourceMappingURL=WorkerB.d.ts.map
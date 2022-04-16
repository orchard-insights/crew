import Worker from '../../src/Worker';
import TaskResponse from '../../src/TaskResponse';
export default class WorkerC extends Worker {
    name: string;
    channel: string;
    executeTask(data: any): Promise<TaskResponse>;
}
//# sourceMappingURL=WorkerC.d.ts.map
import { SetIntervalAsyncTimer } from 'set-interval-async/dynamic';
import Task from './Task';
import TaskResponse from './TaskResponse';
export default abstract class Worker {
    id: string;
    channel: string;
    name: string;
    apiBaseUrl: string;
    task: Task | null;
    pauseWorkgroupSeconds: number;
    workInterval: SetIntervalAsyncTimer | null;
    shuttingDown: boolean;
    workIntervalDelay: number;
    workIntervalRestart: boolean;
    constructor();
    startWork(): Promise<void>;
    stopWork(): Promise<void>;
    abstract cleanup(): Promise<void>;
    abstract executeTask(data: any, parents: any[]): Promise<TaskResponse>;
    abstract isHealthy(): Promise<boolean>;
    private doWork;
}
//# sourceMappingURL=Worker.d.ts.map
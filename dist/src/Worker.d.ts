import { AxiosRequestConfig } from 'axios';
import { SetIntervalAsyncTimer } from 'set-interval-async/dynamic';
import Task from './Task';
import TaskResponse from './TaskResponse';
import WorkerGroup from './WorkerGroup';
export default abstract class Worker {
    id: string;
    channel: string;
    name: string;
    apiBaseUrl: string;
    acquireReleaseAxiosRequestConfig: AxiosRequestConfig;
    task: Task | null;
    pauseWorkgroupSeconds: number;
    workInterval: SetIntervalAsyncTimer | null;
    shuttingDown: boolean;
    workIntervalDelay: number;
    workIntervalRestart: boolean;
    group: WorkerGroup | null;
    constructor();
    startWork(): Promise<void>;
    stopWork(): Promise<void>;
    prepare(): Promise<void>;
    cleanup(): Promise<void>;
    abstract executeTask(data: any, parents: any[]): Promise<TaskResponse>;
    isHealthy(): Promise<boolean>;
    private doWork;
}
//# sourceMappingURL=Worker.d.ts.map
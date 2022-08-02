import express from 'express';
import TaskResponse from './TaskResponse';
import HttpWorkerGroup from './HttpWorkerGroup';
export default abstract class HttpWorker {
    channel: string;
    name: string;
    pauseWorkgroupSeconds: number;
    shuttingDown: boolean;
    group: HttpWorkerGroup | null;
    prepare(): Promise<void>;
    serve(): Promise<void>;
    cleanup(): Promise<void>;
    abstract executeTask(data: any, parents: any[], taskId: string): Promise<TaskResponse>;
    authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void | express.Response<any, Record<string, any>>>;
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=HttpWorker.d.ts.map
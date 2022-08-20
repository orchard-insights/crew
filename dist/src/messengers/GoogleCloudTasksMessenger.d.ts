import Messenger from '../Messenger';
export default class CloudTasksMessenger implements Messenger {
    accessToken: string;
    baseUrl: string;
    examineQueueName: string;
    executeQueueName: string;
    constructor(_accessToken?: string, _baseUrl?: string, _examineQueueName?: string, _executeQueueName?: string);
    publishExamineTask(taskId: string, delayInSeconds?: number): Promise<string | null>;
    publishExecuteTask(taskId: string): Promise<string | null>;
    enqueue(queue: string, url: string, payload: any, delayInSeconds?: number): Promise<string | null>;
    _isTaskPending(taskId: string | null): Promise<boolean>;
    isExaminePending(messageId: string | null): Promise<boolean>;
    isExecutePending(messageId: string | null): Promise<boolean>;
}
//# sourceMappingURL=GoogleCloudTasksMessenger.d.ts.map
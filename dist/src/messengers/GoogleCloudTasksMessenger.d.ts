import Messenger from '../Messenger';
export default class CloudTasksMessenger implements Messenger {
    accessToken: string;
    baseUrl: string;
    examineQueueName: string;
    executeQueueName: string;
    constructor(_accessToken?: string, _baseUrl?: string, _examineQueueName?: string, _executeQueueName?: string);
    publishExamineTask(taskId: string, delayInSeconds?: number): Promise<any>;
    publishExecuteTask(taskId: string): Promise<any>;
    enqueue(queue: string, url: string, payload: any, delayInSeconds?: number): Promise<void>;
}
//# sourceMappingURL=GoogleCloudTasksMessenger.d.ts.map
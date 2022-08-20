import Messenger from '../Messenger';
export default class InlineMessenger implements Messenger {
    publishExamineTask(taskId: string, delayInSeconds: number): Promise<any>;
    publishExecuteTask(taskId: string): Promise<string | null>;
    isExaminePending(messageId: string | null): Promise<boolean>;
    isExecutePending(messageId: string | null): Promise<boolean>;
}
//# sourceMappingURL=InlineMessenger.d.ts.map
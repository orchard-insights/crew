import Messenger from '../Messenger';
export default class InlineMessenger implements Messenger {
    publishExamineTask(taskId: string, delayInSeconds: number): Promise<any>;
    publishExecuteTask(taskId: string): Promise<any>;
}
//# sourceMappingURL=InlineMessenger.d.ts.map
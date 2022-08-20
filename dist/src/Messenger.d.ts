export default interface Messenger {
    publishExamineTask(taskId: string, delayInSeconds: number): Promise<string | null>;
    publishExecuteTask(taskId: string): Promise<string | null>;
    isExaminePending(messageId: string | null): Promise<boolean>;
    isExecutePending(messageId: string | null): Promise<boolean>;
}
export declare const getMessenger: () => Promise<Messenger>;
export declare const setMessenger: (msgr: Messenger) => void;
//# sourceMappingURL=Messenger.d.ts.map
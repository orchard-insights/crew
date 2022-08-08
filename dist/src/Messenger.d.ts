export default interface Messenger {
    publishExamineTask(taskId: string, delayInSeconds: number): Promise<any>;
    publishExecuteTask(taskId: string): Promise<any>;
}
export declare const getMessenger: () => Promise<Messenger>;
export declare const setMessenger: (msgr: Messenger) => void;
//# sourceMappingURL=Messenger.d.ts.map
interface Messenger {
    publishExamineTask(taskId: string, delayInSeconds: number): Promise<any>;
    publishExecuteTask(taskId: string): Promise<any>;
}
export declare const getMessenger: () => Promise<Messenger>;
export {};
//# sourceMappingURL=CloudTasks.d.ts.map
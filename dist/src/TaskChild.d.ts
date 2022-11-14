import { ObjectId } from "mongodb";
export default interface TaskChild {
    _id?: ObjectId;
    taskGroupId?: ObjectId;
    _child_id?: number;
    _parent_ids?: number[];
    name: string;
    channel: string;
    workgroup?: string | null;
    input?: object | null;
    remainingAttempts?: number;
    priority?: number;
    runAfter?: Date | string | null;
    progressWeight?: number;
    isSeed?: boolean;
    key?: string | null;
    parentIds?: ObjectId[];
    isPaused?: boolean;
}
//# sourceMappingURL=TaskChild.d.ts.map
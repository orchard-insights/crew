import { ObjectId } from "mongodb";
/**
 * @openapi
 * components:
 *   schemas:
 *     CreateOperator:
 *       type: object
 *       properties:
 *         channel:
 *           type: string
 *           required: true
 *           description: Which channel this operator can manage tasks for.
 *         url:
 *           type: string
 *           description: Url the operator should POST tasks to.
 *         requestConfig:
 *           type: object
 *           description: Axios request config to use when POSTing the task (for adding Authorization headers).
 *         isPaused:
 *           type: boolean
 *           description: When true, this operator will not proxy requests to url.
 *           default: false
 *     Opeartor:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateOperator'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             createdAt:
 *               type: string
 */
export default class Operator {
    _id?: ObjectId;
    channel: string;
    url: string;
    requestConfig: object | null;
    isPaused: boolean;
    createdAt: Date;
    constructor(channel: string, url: string, requestConfig?: object | null, isPaused?: boolean);
    static findAll(limit?: number, skip?: number): Promise<Operator[]>;
    static countAll(): Promise<number>;
    static findById(id: ObjectId): Promise<Operator>;
    static updateById(id: ObjectId, updates: any): Promise<Operator>;
    static fromData(data: any): Promise<Operator>;
    static deleteById(id: ObjectId): Promise<any>;
    static bootstrap(operator: Operator): Promise<void>;
    static execute(taskId: ObjectId): Promise<void>;
}
//# sourceMappingURL=Operator.d.ts.map
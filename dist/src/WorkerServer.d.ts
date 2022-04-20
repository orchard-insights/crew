/// <reference types="node" />
import express from 'express';
import http from 'http';
import WorkerServerInterface from './WorkerServerInterface';
export default class WorkerServer implements WorkerServerInterface {
    app: express.Express;
    server: http.Server;
    closeOnWorkerShutdown: true;
    constructor();
}
//# sourceMappingURL=WorkerServer.d.ts.map
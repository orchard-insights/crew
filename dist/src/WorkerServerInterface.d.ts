/// <reference types="node" />
import express from 'express';
import http from 'http';
export default interface WorkerServerInterface {
    app: express.Express;
    server: http.Server;
    closeOnWorkerShutdown: boolean;
}
//# sourceMappingURL=WorkerServerInterface.d.ts.map
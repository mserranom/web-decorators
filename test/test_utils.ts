import {configureObject} from '../src/express_decorators';

import {Server} from 'http';
import * as express from 'express';

const bodyParser : any = require('body-parser');
const request : any = require('request-promise');

let app : express.Application;
let server : Server;

const PORT = 9048;

export async function startServer(configs : Array<any>) : Promise<void> {
    let app = await startExpress(PORT);
    configs.forEach(expressConfig => configureObject(expressConfig, app));
}

function startExpress(port : number) : Promise<express.Application> {
    app = express();
    app.use(bodyParser.json());
    return new Promise<express.Application>(function(resolve) {
        server = app.listen(port, () =>  resolve(app));
    });
}

export function stopServer() : void {
    if(!server) {
        throw new Error("express server cannot be stopped, either it doesn't exist or is controlled externally");
    }
    server.close();
    server = null;
    app = null;
}

export async function doGet(endpoint : string, headers? : Object) : Promise<string> {
    headers = headers || {};
    return await request({ method: 'GET', uri : 'http://localhost:' + PORT + endpoint,
        headers : headers});
}

export async function doPost(endpoint : string, body : Object) : Promise<string> {
    return await request({ method: 'POST', uri : 'http://localhost:' + PORT + endpoint,
        body : body, json: true});
}

export const mochaAsync = (fn) => {
    return async (done) => {
        try {
            await fn();
            done();
        } catch (err) {
            done(err);
        }
    };
};

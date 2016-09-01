import {configureExpressService} from '../src/express_decorators';

import {Server} from 'http';
import * as express from 'express';

const bodyParser : any = require('body-parser');
const request : any = require('request-promise');

var app : any;
var server : any;

const EXPRESS_PORT = 9048;
const RESTIFY_PORT = 9049;
let currentPort : number;

export async function startExpressServer(configs : Array<any>) : Promise<void> {
    // startRestifyServer(configs);
    app = server = null;
    await startExpress();
    configs.forEach(expressConfig => configureExpressService(expressConfig, app));
}

export async function startRestifyServer(configs : Array<any>) : Promise<void> {
    app = server = null;
    await startRestify();
    configs.forEach(expressConfig => configureExpressService(expressConfig, app));
}

function startExpress() : Promise<void> {
    currentPort = EXPRESS_PORT;
    app = express();
    app.use(bodyParser.json());
    return new Promise<void>((resolve) => {
        server = app.listen(EXPRESS_PORT, () => {
            app.get('/infra', (req, res) => res.send('express'));
            resolve();
        });});
}

function startRestify() : Promise<void> {
    currentPort = RESTIFY_PORT;
    const restify = require('restify');

    server = restify.createServer({
        name: 'myapp',
        version: '1.0.0'
    });

    server.use(restify.bodyParser());

    app = server;

    server.get('/infra', (req, res) => res.send('restify'));

    return new Promise<void>(function(resolve) {
        server.listen(RESTIFY_PORT, () => resolve());
    });
}

export function stopServer() : void {
    if(!server) {
        throw new Error("express server cannot be stopped, either it doesn't exist or is controlled externally");
    }
    server.close();
    app = server = null;
}

export async function doGet(endpoint : string, headers? : Object) : Promise<string> {
    headers = headers || {};
    return await request({ method: 'GET', uri : 'http://localhost:' + currentPort + endpoint,
        headers : headers});
}

export async function doPost(endpoint : string, body : Object) : Promise<string> {
    return await request({ method: 'POST', uri : 'http://localhost:' + currentPort + endpoint,
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

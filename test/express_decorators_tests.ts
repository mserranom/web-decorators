"use strict";

import {Application} from 'express';

import {Server} from 'http';

import {configureObject} from '../src/express_decorators';

import {TestEndpoint, TestEndpoint2, TestEntity} from './test_services'

import * as express from 'express';
const bodyParser : any = require('body-parser');

var expect = require('chai').expect;
var request : any = require('request-promise');

let app : express.Application;
let server : Server;


// ------------------
// EXPRESS BOOTSTRAP
// ------------------

function startExpress(port : number) : Promise<void> {

    app = express();

    app.use(bodyParser.json());

    return new Promise<void>(function(resolve, reject) {
        server = app.listen(port, () =>  resolve());
    });
}

async function start(port : number, configs : Array<any>) : Promise<void> {
    await startExpress(port);
    configs.forEach(expressConfig => configureObject(expressConfig, app));
}

async function configureExpress(application: Application, configs : Array<any>) : Promise<void> {
    app = application;
    configs.forEach(expressConfig => configureObject(expressConfig, app));
}

function stop() : void {
    if(!server) {
        throw new Error("express server cannot be stopped, either it doesn't exist or is controlled externally");
    }
    server.close();
}

// ----------
// SPECS
// ----------

describe('REST decorators:', () => {

    var PORT = 9048;

    afterEach( (done) => {
        stop();
        done();
    });

    async function doGet(endpoint : string, headers? : Object) : Promise<string> {
        headers = headers || {};
        return await request({ method: 'GET', uri : 'http://localhost:' + PORT + endpoint,
            headers : headers});
    }

    async function doPost(endpoint : string, body : Object) : Promise<string> {
        return await request({ method: 'POST', uri : 'http://localhost:' + PORT + endpoint,
            body : body, json: true});
    }

    describe('routing:', () => {

        it('single endpoint defined in single class',  async function(done) {

            await start(PORT, [new TestEndpoint()]);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');

            done();
        });

        it('endpoints defined in multiple classes',  async function(done) {

            await start(PORT, [new TestEndpoint(), new TestEndpoint2()]);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');

            let hi = await doGet('/hi');
            expect(hi).equals('hello!');

            done();
        });

        it('sending a string body in a POST method',  async function(done) {
            await start(PORT, [new TestEndpoint(), new TestEndpoint2()]);

            let hi = await doGet('/hi');
            expect(hi).equals('hello!');

            await doPost('/hi', {message : 'updated_message'});
            hi = await doGet('/hi');
            expect(hi).equals('updated_message');

            done();
        });

        it('sending an object as body in a POST method',  async function(done) {
            await start(PORT, [new TestEndpoint(), new TestEndpoint2()]);

            let fetchedEntity = await doGet('/entities/101');
            expect(JSON.parse(fetchedEntity)).deep.equal({id : '101', name: 'entity'});

            let newEntity = new TestEntity();
            newEntity.id = '1220';

            await doPost('/entities', newEntity);
            fetchedEntity = await doGet('/entities/1220');
            expect(JSON.parse(fetchedEntity)).deep.equal({id : '1220', name: 'entity'});

            done();
        });

        it('query parameters are passed to the method',  async function(done) {

            await start(PORT, [new TestEndpoint(), new TestEndpoint2()]);

            let fetchedData = await doGet('/numbers/101?from=1&to=3');
            expect(JSON.parse(fetchedData)).deep.equal([4,5]);

            done();
        });

        it('unneeded query parameters are ignored',  async function(done) {

            await start(PORT, [new TestEndpoint(), new TestEndpoint2()]);

            let fetchedData = await doGet('/numbers/101?unused=foo&from=2&foo=0&to=5');
            expect(JSON.parse(fetchedData)).deep.equal([5,6,7]);

            done();
        });

        it('headers are passed to the method',  async function(done) {

            await start(PORT, [new TestEndpoint(), new TestEndpoint2()]);

            let fetchedData = await doGet('/header_data/myId?query=myQuery',{header1:'myHeader1',header2:'myHeader2'});
            expect(fetchedData).equals('pong');

            done();
        });

        it('GET an undefined entity returns empty string',  async function(done) {

            await start(PORT, [new TestEndpoint()]);

            let fetchedEntity = await doGet('/entities/foo');
            expect(fetchedEntity).equal('');

            done();
        });

        it('a sync Error in the handler returns a 500 error',  async function(done) {

            await start(PORT, [new TestEndpoint()]);

            try {
                await doGet('/wrong');
            } catch(error) {
                expect(error.statusCode).equal(500);
                done();
            }

            expect(true).equal(false);

            done();
        });


        it('promises are resolved correctly',  async function(done) {

            await start(PORT, [new TestEndpoint()]);

            let fetchedEntity = await doGet('/async_entities/101');
            expect(JSON.parse(fetchedEntity)).deep.equal({id : '101', name: 'entity'});

            done();
        });


        it('an async Error thrown while handling a promise returns a 500 error',  async function(done) {

            await start(PORT, [new TestEndpoint()]);

            try {
                await doGet('/wrong_async');
            } catch(error) {
                expect(error.statusCode).equal(500);
                done();
            }

            expect(true).equal(false);
            done();
        });

        it('methods returning readable streams are piped to the response',  async function(done) {

            await start(PORT, [new TestEndpoint()]);

            let result = await doGet('/stream_data');

            expect(result).equal('data piped correctly!');

            done();
        });

    });

});




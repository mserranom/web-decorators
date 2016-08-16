"use strict";

import {Readable} from 'stream'

import {start, stop, RequestMapping, Route, Middleware, GET, POST} from '../src/express_decorators';

async function sleep(ms:number) : Promise<any> {
    return new Promise<void>(function(resolve) {
        setTimeout(function(){ resolve() }, ms);
    });
}

function setupChai() {
    var chai = require('chai');
    chai.should(); // enables use of should object

    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);

    var chaiThings = require('chai-things');
    chai.use(chaiThings);
}

var expect = require('chai').expect;
setupChai();

var request : any = require('request-promise');




// ----------
// TEST DATA
// ----------

let emptyMiddleware = (req, res, next) => next();

function zeroIdCheckMiddleware(req, res, next) {
    let body = req.body;
    if(body['id'] === '0') {
        res.status(413).send('id is zero');
    }
    next();
}

function nameNullCheckMiddleware(req, res, next) {
    let body = req.body;
    if(body['name'] === null) {
        res.status(414).send('id is null');
    }
    next();
}

class TestEntity {
    name : string = 'entity';
    id : string = '101';
}

@Middleware(nameNullCheckMiddleware)
class TestEndpoint {

    private data : TestEntity = new TestEntity();

    @RequestMapping('get', '/ping')
    pong() : string {
        return 'pong!';
    }

    @RequestMapping('POST', '/entities')
    @Middleware([emptyMiddleware, zeroIdCheckMiddleware, emptyMiddleware])
    setData(data : TestEntity) : void {
        this.data = data;
    }

    @RequestMapping('GET', '/entities/:id')
    getData(id : string) : TestEntity {
        return (this.data.id === id) ? this.data : undefined;
    }

    @RequestMapping('GET', '/async_entities/:id')
    async getAsyncData(id : string) : Promise<TestEntity> {
        await sleep(1);
        return (this.data.id === id) ? this.data : undefined;
    }

    @RequestMapping('GET', '/wrong')
    throwError() : TestEntity {
        throw new Error('error thrown');
    }

    @RequestMapping('GET', '/wrong_async')
    async throwAsyncError() : Promise<void> {
        await sleep(1);
        throw new Error('error thrown');
    }

    @RequestMapping('GET', '/stream_data')
    pipeData() : Readable {
        let stream = new Readable();
        stream._read = function noop() {}; // redundant? see update below
        stream.push('data piped correctly!');
        stream.push(null);
        return stream;
    }

    @RequestMapping('get', '/numbers/:id',['from','to'])
    sliceNumbers(id : string, from : number, to : number) : Array<number> {
        let data = [3,4,5,6,7];
        if(id == '101') {
            return data.slice(from, to);
        } else {
            throw new Error('unknown id');
        }
    }

    @GET('/header_data/:id',['query'], ['header1', 'header2'])
    dataWithHeaders(id : string, query : string, header1 : string, header2 : string) : string {
        if(id == 'myId' && query == 'myQuery' && header1 == 'myHeader1' && header2 == 'myHeader2') {
            return 'pong';
        } else {
            throw new Error('unknown input');
        }
    }

}

@Route('/hi')
@Middleware(emptyMiddleware)
class TestEndpoint2 {

    private message = 'hello!';

    @RequestMapping('get')
    @Middleware([emptyMiddleware])
    getMessage() : string {
        return this.message;
    }

    @POST()
    setMessage(message : string) : void {
        this.message = message;
    }

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

    describe('middleware:', () => {

        it('method defined middleware can fail request',  async function(done) {

            await start(PORT, [new TestEndpoint(), new TestEndpoint2()]);

            let newEntity = new TestEntity();
            newEntity.id = '0';

            try {
                await doPost('/entities', newEntity);
            } catch(error) {
                expect(error.statusCode).equal(413);
                done();
            }

            expect(true).equal(false);
            done();
        });

        it('class defined middleware can fail request',  async function(done) {

            await start(PORT, [new TestEndpoint(), new TestEndpoint2()]);

            let newEntity = new TestEntity();
            newEntity.name = null;

            try {
                await doPost('/entities', newEntity);
            } catch(error) {
                expect(error.statusCode).equal(414);
                done();
            }

            expect(true).equal(false);
            done();
        });

        it('class middleware is executed before method middleware',  async function(done) {

            await start(PORT, [new TestEndpoint(), new TestEndpoint2()]);

            let newEntity = new TestEntity();
            newEntity.id = '0';
            newEntity.name = null;

            try {
                await doPost('/entities', newEntity);
            } catch(error) {
                expect(error.statusCode).equal(414);
                done();
            }

            expect(true).equal(false);
            done();
        });

    });

});




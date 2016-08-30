import {TestEndpoint, TestEndpoint2, TestEntity} from './test_services'
import {doPost, doGet, startServer, stopServer} from './test_utils'

import {expect} from 'chai';

describe('REST decorators:', () => {

    afterEach( (done) => {
        stopServer();
        done();
    });

    describe('routing:', () => {

        it('sending a string body in a POST method',  async function(done) {
            await startServer([new TestEndpoint(), new TestEndpoint2()]);

            let hi = await doGet('/hi');
            expect(hi).equals('hello!');

            await doPost('/hi', {message : 'updated_message'});
            hi = await doGet('/hi');
            expect(hi).equals('updated_message');

            done();
        });

        it('sending an object as body in a POST method',  async function(done) {
            await startServer([new TestEndpoint(), new TestEndpoint2()]);

            let fetchedEntity = await doGet('/entities/101');
            expect(JSON.parse(fetchedEntity)).deep.equal({id : '101', name: 'entity'});

            let newEntity = new TestEntity();
            newEntity.id = '1220';

            await doPost('/entities', newEntity);
            fetchedEntity = await doGet('/entities/1220');
            expect(JSON.parse(fetchedEntity)).deep.equal({id : '1220', name: 'entity'});

            done();
        });

        it('unneeded query parameters are ignored',  async function(done) {

            await startServer([new TestEndpoint(), new TestEndpoint2()]);

            let fetchedData = await doGet('/numbers/101?unused=foo&from=2&foo=0&to=5');
            expect(JSON.parse(fetchedData)).deep.equal([5,6,7]);

            done();
        });

        it('headers are passed to the method',  async function(done) {

            await startServer([new TestEndpoint(), new TestEndpoint2()]);

            let fetchedData = await doGet('/header_data/myId?query=myQuery',{header1:'myHeader1',header2:'myHeader2'});
            expect(fetchedData).equals('pong');

            done();
        });

        it('GET an undefined entity returns empty string',  async function(done) {

            await startServer([new TestEndpoint()]);

            let fetchedEntity = await doGet('/entities/foo');
            expect(fetchedEntity).equal('');

            done();
        });

        it('a sync Error in the handler returns a 500 error',  async function(done) {

            await startServer([new TestEndpoint()]);

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

            await startServer([new TestEndpoint()]);

            let fetchedEntity = await doGet('/async_entities/101');
            expect(JSON.parse(fetchedEntity)).deep.equal({id : '101', name: 'entity'});

            done();
        });


        it('an async Error thrown while handling a promise returns a 500 error',  async function(done) {

            await startServer([new TestEndpoint()]);

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

            await startServer([new TestEndpoint()]);

            let result = await doGet('/stream_data');

            expect(result).equal('data piped correctly!');

            done();
        });

    });

});




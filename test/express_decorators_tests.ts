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

        it('headers are passed to the method',  async function(done) {

            await startServer([new TestEndpoint(), new TestEndpoint2()]);

            let fetchedData = await doGet('/header_data/myId?query=myQuery',{header1:'myHeader1',header2:'myHeader2'});
            expect(fetchedData).equals('pong');

            done();
        });
    });
});




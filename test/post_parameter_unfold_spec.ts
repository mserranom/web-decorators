import {TestEndpoint, TestEndpoint2, TestEntity} from './service_examples'
import {doPost, doGet, startServer, stopServer, mochaAsync} from './test_utils'

import {expect} from 'chai';

describe('POST parameter unfolding', () => {

    afterEach( () => {
        stopServer();
    });

    it('sending a string body in a POST method',  mochaAsync(async () => {
        await startServer([new TestEndpoint(), new TestEndpoint2()]);

        let hi = await doGet('/hi');
        expect(hi).equals('hello!');

        await doPost('/hi', {message : 'updated_message'});
        hi = await doGet('/hi');
        expect(hi).equals('updated_message');
    }));

    it('sending an object as body in a POST method',  mochaAsync(async () => {
        await startServer([new TestEndpoint(), new TestEndpoint2()]);

        let fetchedEntity = await doGet('/entities/101');
        expect(JSON.parse(fetchedEntity)).deep.equal({id : '101', name: 'entity'});

        let newEntity = new TestEntity();
        newEntity.id = '1220';

        await doPost('/entities', newEntity);
        fetchedEntity = await doGet('/entities/1220');
        expect(JSON.parse(fetchedEntity)).deep.equal({id : '1220', name: 'entity'});
    }));

    it('headers are passed to the method',  mochaAsync(async () => {

        await startServer([new TestEndpoint(), new TestEndpoint2()]);

        let fetchedData = await doGet('/header_data/myId?query=myQuery',{header1:'myHeader1',header2:'myHeader2'});
        expect(fetchedData).equals('pong');
    }));
});




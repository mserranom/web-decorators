import {TestEndpoint, TestEndpoint2, TestEntity} from './test_services'
import {doPost, doGet, startServer, stopServer, mochaAsync} from './test_utils'

import {expect} from 'chai';

describe('Handler Result Unwrapping', () => {

    afterEach( () => {
        stopServer();
    });

    it('GET an undefined entity should return an empty string', mochaAsync(async () => {

        await startServer([new TestEndpoint()]);

        let fetchedEntity = await doGet('/entities/foo');
        expect(fetchedEntity).equal('');
    }));

    it('promise result should be sent to response', mochaAsync(async () => {

        await startServer([new TestEndpoint()]);

        let fetchedEntity = await doGet('/async_entities/101');
        expect(JSON.parse(fetchedEntity)).deep.equal({id : '101', name: 'entity'});
    }));

    it('returned readable streams should be piped to the response', mochaAsync(async () => {

        await startServer([new TestEndpoint()]);

        let result = await doGet('/stream_data');

        expect(result).equal('data piped correctly!');
    }));
});




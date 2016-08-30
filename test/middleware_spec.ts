import {TestEndpoint, TestEntity} from './service_examples'
import {doPost, startServer, stopServer, mochaAsync} from './test_utils'

import {expect} from 'chai';

describe('middleware', () => {

    afterEach(() => {
        stopServer();
    });

    it('method-level defined middleware can fail request',  mochaAsync(async () => {

        await startServer([new TestEndpoint()]);

        let newEntity = new TestEntity();
        newEntity.id = '0';

        try {
            await doPost('/entities', newEntity);
        } catch(error) {
            expect(error.statusCode).equal(413);
        }
    }));

    it('class-level defined middleware can fail request',  mochaAsync(async () => {

        await startServer([new TestEndpoint()]);

        let newEntity = new TestEntity();
        newEntity.name = null;

        try {
            await doPost('/entities', newEntity);
        } catch(error) {
            expect(error.statusCode).equal(414);
        }
    }));

    it('class-level middleware is executed before method-level middleware',  mochaAsync(async () => {

        await startServer([new TestEndpoint()]);

        let newEntity = new TestEntity();
        newEntity.id = '0';
        newEntity.name = null;

        try {
            await doPost('/entities', newEntity);
        } catch(error) {
            expect(error.statusCode).equal(414);
        }
    }));

});




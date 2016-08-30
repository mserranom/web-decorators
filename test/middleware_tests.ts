import {TestEndpoint, TestEndpoint2, TestEntity} from './test_services'
import {doPost, startServer, stopServer} from './test_utils'

import {expect} from 'chai';

describe('REST decorators:', () => {

    afterEach( (done) => {
        stopServer();
        done();
    });

    describe('middleware:', () => {

        it('method defined middleware can fail request',  async function(done) {

            await startServer([new TestEndpoint(), new TestEndpoint2()]);

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

            await startServer([new TestEndpoint(), new TestEndpoint2()]);

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

            await startServer([new TestEndpoint(), new TestEndpoint2()]);

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




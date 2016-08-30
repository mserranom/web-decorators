import {GET} from '../src/express_decorators';

import {doGet, startServer, stopServer, mochaAsync} from './test_utils'

import {expect} from 'chai';

async function sleep(ms:number) : Promise<any> {
    return new Promise<void>(function(resolve) {
        setTimeout(function(){ resolve() }, ms);
    });
}

describe('Error Handling:', () => {

    afterEach( () => {
        stopServer();
    });

    it('a sync Error should should return a HTTP Code 500',  mochaAsync(async () => {

        class TestService {
            @GET('/wrong')
            throwError() {
                throw new Error('error thrown');
            }
        }

        await startServer([new TestService()]);

        try {
            await doGet('/wrong');
        } catch(error) {
            expect(error.statusCode).equal(500);
            expect(JSON.parse(error.error).message).equals('Error: error thrown');
        }
    }));

    it.skip('an unhandled async Error should return a HTTP Code 500',  mochaAsync(async () => {

        class TestService {
            @GET('/wrong_async')
            throwAsyncError() {
                setTimeout(() => {throw new Error('error thrown')}, 1);
            }
        }

        await startServer([new TestService()]);

        try {
            await doGet('/wrong_async');
        } catch(error) {
            expect(error.statusCode).equal(500);
            expect(JSON.parse(error.error).message).equals('Error: error thrown');
        }
    }));

    it('an async Error thrown while waiting for a Promise should return a HTTP Code 500',  mochaAsync(async () => {

        class TestService {
            @GET('/wrong_async_promise')
            async throwAsyncError(): Promise<void> {
                await sleep(1);
                throw new Error('error thrown');
            }
        }

        await startServer([new TestService()]);

        try {
            await doGet('/wrong_async_promise');
        } catch(error) {
            expect(error.statusCode).equal(500);
            expect(JSON.parse(error.error).message).equals('Error: error thrown');
        }
    }));

    it.skip('a rejected Promise should return a HTTP Code 500',  mochaAsync(async () => {

        class TestService {
            @GET('/reject_promise')
            rejectPromise(): Promise<void> {
                return new Promise((resolve, reject) => {setTimeout(() => reject(), 1)});
            }
        }

        await startServer([new TestService()]);

        try {
            await doGet('/reject_promise');
        } catch(error) {
            expect(error.statusCode).equal(500);
        }
    }));


});




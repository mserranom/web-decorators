import {GET, ErrorHandler} from '../src/express_decorators';

import {doGet, startServer, stopServer, mochaAsync} from './test_utils'

import {expect} from 'chai';

async function sleep(ms:number) : Promise<any> {
    return new Promise<void>(function(resolve) {
        setTimeout(function(){ resolve() }, ms);
    });
}

function throwError() {
    throw new Error('error thrown');
}

function rejectPromise() {
    return new Promise((resolve, reject) => {setTimeout(() => reject('error thrown'), 1)});
}

describe('error handling', () => {

    afterEach( () => {
        stopServer();
    });

    describe('default error handling', () => {

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
                expect(true).equal(false);
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
                expect(true).equal(false);
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
                expect(true).equal(false);
            } catch(error) {
                expect(error.statusCode).equal(500);
                expect(JSON.parse(error.error).message).equals('Error: error thrown');
            }
        }));

        it('a rejected Promise should return a HTTP Code 500',  mochaAsync(async () => {

            class TestService {
                @GET('/reject_promise')
                rejectPromise(): Promise<void> {
                    return new Promise((resolve, reject) => {setTimeout(() => reject(), 1)});
                }
            }

            await startServer([new TestService()]);

            try {
                await doGet('/reject_promise');
                expect(true).equal(false);
            } catch(error) {
                expect(error.statusCode).equal(500);
            }
        }));

    });

    [throwError, rejectPromise].forEach((fail : any) =>  {
        describe('user defined error handlers', () => {

        it('method-level handlers should handle errors',  mochaAsync(async () => {

            function errorHandler(err, req, res, next) {
                res.status(599);
                res.send('handled - ' + err);
            }

            class TestService {
                @GET('/wrong')
                @ErrorHandler(errorHandler)
                throwError() { return fail(); }
            }

            await startServer([new TestService()]);

            try {
                await doGet('/wrong');
                expect(true).equal(false);
            } catch(error) {
                expect(error.statusCode).equal(599);
                expect(error.error).contains('handled - ');
                expect(error.error).contains(' error thrown');
            }
        }));

        it('when error handler is not ended, default error handler is executed',  mochaAsync(async () => {

            function middlewareErrorHandler(err, req, res, next) {
                res.status(599);
                next(err);
            }

            class TestService {
                @GET('/wrong')
                @ErrorHandler(middlewareErrorHandler)
                throwError() { return fail(); }
            }

            const DEFAULT_ERROR_CODE = 500;

            await startServer([new TestService()]);

            try {
                await doGet('/wrong');
                expect(true).equal(false);
            } catch(error) {
                expect(error.statusCode).equal(DEFAULT_ERROR_CODE);
                expect(JSON.parse(error.error).message).contains('error thrown');
            }
        }));

        it('class-level handlers should handle errors',  mochaAsync(async () => {

            function errorHandler(err, req, res, next) {
                res.status(599);
                res.send('handled - ' + err);
            }

            @ErrorHandler(errorHandler)
            class TestService {
                @GET('/wrong')
                throwError() { return fail(); }
            }

            await startServer([new TestService()]);

            try {
                await doGet('/wrong');
                expect(true).equal(false);
            } catch(error) {
                expect(error.statusCode).equal(599);
                expect(error.error).contains('handled - ');
                expect(error.error).contains(' error thrown');
            }
        }));

        it('class-level handlers are executed before method-level handlers',  mochaAsync(async () => {

            function classLevelHandle(err, req, res, next) {
                next('class-level message - ');
            }

            function methodLevelHandler(err, req, res, next) {
                res.status(599);
                res.send(err + ' method-level message');
            }

            @ErrorHandler(classLevelHandle)
            class TestService {
                @GET('/wrong')
                @ErrorHandler(methodLevelHandler)
                throwError() { return fail(); }
            }

            await startServer([new TestService()]);

            try {
                await doGet('/wrong');
                expect(true).equal(false);
            } catch(error) {
                expect(error.error).equals('class-level message -  method-level message');
                expect(error.statusCode).equal(599);
            }
        }));

        it('an array of handlers should be executed in order',  mochaAsync(async () => {

            function handler1(err, req, res, next) {
                next('first handler - ');
            }

            function handler2(err, req, res, next) {
                res.status(599).send(err + ' second handler');
            }

            class TestService {
                @GET('/wrong')
                @ErrorHandler([handler1, handler2])
                throwError() { return fail(); }
            }

            await startServer([new TestService()]);

            try {
                await doGet('/wrong');
                expect(true).equal(false);
            } catch(error) {
                expect(error.error).equals('first handler -  second handler');
                expect(error.statusCode).equal(599);
            }
        }));

    })});
});




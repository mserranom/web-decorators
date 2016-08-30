
import {GET, Route} from '../src/express_decorators';
import {doGet, startServer, stopServer} from './test_utils'

import {expect} from 'chai';

describe('Basic Routing:', () => {

    afterEach( (done) => {
        stopServer();
        done();
    });

    describe('routing:', () => {

        it('single endpoint defined in single class',  async function(done) {

            class PingService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
            }

            await startServer([new PingService()]);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');

            done();
        });

        it('two endpoints defined in single class',  async function(done) {

            class TestService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
                @GET('/hi')
                hello(): string {
                    return 'hello!';
                }
            }

            await startServer([new TestService()]);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');

            let hello = await doGet('/hi');
            expect(hello).equals('hello!');

            done();
        });

        it('two endpoints defined in separate classes',  async function(done) {

            class PingService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
            }

            class HiService {
                @GET('/hi')
                hello(): string {
                    return 'hello!';
                }
            }

            await startServer([new PingService(), new HiService()]);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');

            let hello = await doGet('/hi');
            expect(hello).equals('hello!');

            done();
        });


        it('class-level routing',  async function(done) {

            @Route('/ping_service')
            class PingService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
            }

            await startServer([new PingService()]);

            let pong = await doGet('/ping_service/ping');
            expect(pong).equals('pong!');

            done();
        });

        it.skip('class-level routing does not require initial / character',  async function(done) {

            @Route('ping_service')
            class PingService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
            }

            await startServer([new PingService()]);

            let pong = await doGet('/ping_service/ping');
            expect(pong).equals('pong!');

            done();
        });

        it('nested routes',  async function(done) {

            @Route('/ping_service/nested_route/service')
            class PingService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
            }

            await startServer([new PingService()]);

            let pong = await doGet('/ping_service/nested_route/service/ping');
            expect(pong).equals('pong!');

            done();
        });

    });

});




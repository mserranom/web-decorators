import {GET, Route} from '../src/express_decorators';
import {doGet, startServer, stopServer, mochaAsync} from './test_utils'

import {expect} from 'chai';

describe('Basic Routing:', () => {

    afterEach( () => {
        stopServer();
    });

    describe('routing:', () => {

        it('single endpoint defined in single class',  mochaAsync(async () => {

            class PingService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
            }

            await startServer([new PingService()]);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');
        }));

        it('two endpoints defined in single class',  mochaAsync(async () => {

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
        }));

        it('two endpoints defined in separate classes',  mochaAsync(async () => {

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
        }));


        it('class-level routing',  mochaAsync(async () => {

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
        }));

        it.skip('class-level routing does not require initial / character',  mochaAsync(async () => {

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
        }));

        it('nested routes',  mochaAsync(async () => {

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
        }));

    });

});




import {GET, Route} from '../src/express_decorators';
import {doGet, startExpressServer, startRestifyServer, stopServer, mochaAsync} from './test_utils'

import {expect} from 'chai';

async function sleep(ms:number) : Promise<any> {
    return new Promise<void>(function(resolve) {
        setTimeout(function(){ resolve() }, ms);
    });
}

[startExpressServer/*, startRestifyServer*/].forEach((startWebServer : any) =>  {

describe('basic GET routing', () => {

    afterEach( async function (done) {
        stopServer();
        await sleep(1);
        done();
    });

    describe('method-level routing', () => {

        it('single endpoint defined in single method',  mochaAsync(async () => {

            class PingService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
            }

            await startWebServer([new PingService()]);

            let infra = await doGet('/infra');
            console.log('infra: ' + infra);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');
        }));

        it('empty route defined at method level with no class-level route should resolve to base URL',  mochaAsync(async () => {

            class PingService {
                @GET()
                pong(): string {
                    return 'pong!';
                }
            }

            await startWebServer([new PingService()]);

            let pong = await doGet('/');
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

            await startWebServer([new TestService()]);

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

            await startWebServer([new PingService(), new HiService()]);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');

            let hello = await doGet('/hi');
            expect(hello).equals('hello!');
        }));

        it('method-level routing should not require initial slash "/" character',  mochaAsync(async () => {

            class PingService {
                @GET('ping')
                pong(): string {
                    return 'pong!';
                }
            }

            await startWebServer([new PingService()]);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');
        }));

    });

    describe('class-level routing', () => {

        it('class-level routing',  mochaAsync(async () => {

            @Route('/ping_service')
            class PingService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
            }

            await startWebServer([new PingService()]);

            let pong = await doGet('/ping_service/ping');
            expect(pong).equals('pong!');
        }));

        it('empty route defined at class and method-level should resolve to base URL',  mochaAsync(async () => {

            @Route('')
            class PingService {
                @GET()
                pong(): string {
                    return 'pong!';
                }
            }

            await startWebServer([new PingService()]);

            let pong = await doGet('/');
            expect(pong).equals('pong!');
        }));

        it('slash route defined at class-level and empty method-level route should resolve to base URL',  mochaAsync(async () => {

            @Route('/')
            class PingService {
                @GET()
                pong(): string {
                    return 'pong!';
                }
            }

            await startWebServer([new PingService()]);

            let pong = await doGet('/');
            expect(pong).equals('pong!');
        }));

        it('class-level routing with empty method-level route should resolve to class-level route',  mochaAsync(async () => {

            @Route('/ping')
            class PingService {
                @GET()
                pong(): string {
                    return 'pong!';
                }
            }

            await startWebServer([new PingService()]);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');
        }));

        it('slash route defined at class-level and should resolve method-level routes correctly',  mochaAsync(async () => {

            @Route('/')
            class PingService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
            }

            await startWebServer([new PingService()]);

            let pong = await doGet('/ping');
            expect(pong).equals('pong!');
        }));

        it('class-level routing should not require initial slash "/" character',  mochaAsync(async () => {

            @Route('ping_service')
            class PingService {
                @GET('/ping')
                pong(): string {
                    return 'pong!';
                }
            }

            await startWebServer([new PingService()]);

            let pong = await doGet('/ping_service/ping');
            expect(pong).equals('pong!');
        }));

        it('routes can be nested',  mochaAsync(async () => {

            @Route('/ping_service/nested_route/service')
            class PingService {
                @GET('/ping/pong')
                pong(): string {
                    return 'pong!';
                }
            }

            await startWebServer([new PingService()]);

            let pong = await doGet('/ping_service/nested_route/service/ping/pong');
            expect(pong).equals('pong!');
        }));
    });
});
});




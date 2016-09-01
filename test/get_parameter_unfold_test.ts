import {GET} from '../src/express_decorators';

import {doGet, startServer, stopServer, mochaAsync} from './test_utils'

import {expect} from 'chai';

describe('GET parameter unfolding', () => {

    afterEach( () => {
        stopServer();
    });

    it('single route parameters',  mochaAsync(async () => {

        class HelloService {
            @GET('/hello/:name')
            hello(name : string): string {
                return `hello ${name}!`;
            }
        }

        await startServer([new HelloService()]);

        let pong = await doGet('/hello/joe');
        expect(pong).equals('hello joe!');
    }));

    it('multiple route parameters',  mochaAsync(async () => {

        class HelloService {
            @GET('/hello/:name/:message')
            helloMessage(name : string, message : string): string {
                return `hello ${name}, ${message}!`;
            }
        }

        await startServer([new HelloService()]);

        let pong = await doGet('/hello/joe/cheers');
        expect(pong).equals('hello joe, cheers!');
    }));

    it('query parameters',  mochaAsync(async () => {

        class HelloService {
            @GET('/hello', ['name', 'message'])
            helloMessage(name : string, message : string): string {
                return `hello ${name}, ${message}!`;
            }
        }

        await startServer([new HelloService()]);

        let pong = await doGet('/hello?name=joe&message=cheers');
        expect(pong).equals('hello joe, cheers!');
    }));

    it('route and query parameters combined',  mochaAsync(async () => {

        class HelloService {
            @GET('/hello/:name', ['message'])
            helloMessage(name : string, message : string): string {
                return `hello ${name}, ${message}!`;
            }
        }

        await startServer([new HelloService()]);

        let pong = await doGet('/hello/joe?message=cheers');
        expect(pong).equals('hello joe, cheers!');
    }));

    it('multiple route and query parameters combined', mochaAsync(async () => {

        class HelloService {
            @GET('/hello/:name/friend/:friend_name', ['message1', 'message2'])
            helloFriendMessage(name : string, friendName : string,
                         message1 : string, message2 : string): string {
                return `hello ${friendName}, friend of ${name}, ${message1} and ${message2}!`;
            }
        }

        await startServer([new HelloService()]);

        let pong = await doGet('/hello/joe/friend/michael?message1=cheers&message2=good_luck');
        expect(pong).equals('hello michael, friend of joe, cheers and good_luck!');
    }));

    it('unnecessary query parameters should be ignored',  mochaAsync(async () => {

        class RangeService {
            @GET('/range', ['from', 'to'])
            range(from: number, to: number): Array<number> {
                return [3, 4, 5, 6, 7].slice(from, to);
            }
        }

        await startServer([new RangeService()]);

        let fetchedData = await doGet('/range?unused=foo&from=2&foo=0&to=5');
        expect(JSON.parse(fetchedData)).deep.equal([5,6,7]);
    }));
});

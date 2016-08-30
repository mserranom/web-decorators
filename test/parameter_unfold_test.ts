import {GET} from '../src/express_decorators';

import {doGet, startServer, stopServer} from './test_utils'

import {expect} from 'chai';

describe('GET parameter unfolding:', () => {

    afterEach( (done) => {
        stopServer();
        done();
    });

    it('single route parameters',  async function(done) {

        class HelloService {
            @GET('/hello/:name')
            hello(name : string): string {
                return `hello ${name}!`;
            }
        }

        await startServer([new HelloService()]);

        let pong = await doGet('/hello/joe');
        expect(pong).equals('hello joe!');

        done();
    });

    it('multiple route parameters',  async function(done) {

        class HelloService {
            @GET('/hello/:name/:message')
            helloMessage(name : string, message : string): string {
                return `hello ${name}, ${message}!`;
            }
        }

        await startServer([new HelloService()]);

        let pong = await doGet('/hello/joe/cheers');
        expect(pong).equals('hello joe, cheers!');

        done();
    });

    it('query parameters',  async function(done) {

        class HelloService {
            @GET('/hello', ['name', 'message'])
            helloMessage(name : string, message : string): string {
                return `hello ${name}, ${message}!`;
            }
        }

        await startServer([new HelloService()]);

        let pong = await doGet('/hello?name=joe&message=cheers');
        expect(pong).equals('hello joe, cheers!');

        done();
    });

    it('route and query parameters combined',  async function(done) {

        class HelloService {
            @GET('/hello/:name', ['message'])
            helloMessage(name : string, message : string): string {
                return `hello ${name}, ${message}!`;
            }
        }

        await startServer([new HelloService()]);

        let pong = await doGet('/hello/joe?message=cheers');
        expect(pong).equals('hello joe, cheers!');

        done();
    });

    it('multiple route and query parameters combined',  async function(done) {

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

        done();
    });
});

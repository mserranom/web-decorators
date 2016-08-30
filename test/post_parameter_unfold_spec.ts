import {GET, POST, Route} from '../src/express_decorators';
// import {TestEndpoint, TestEntity} from './service_examples'
import {doPost, doGet, startServer, stopServer, mochaAsync} from './test_utils'

import {expect} from 'chai';

describe('POST parameter unfolding', () => {

    afterEach( () => {
        stopServer();
    });

    it('sending a string body in a POST method',  mochaAsync(async () => {

        @Route('/hi')
        class TestService {
            private message = 'hello!';
            @POST() setMessage(message: string): void { this.message = message; }
            @GET()  getMessage(): string { return this.message; }
        }

        await startServer([new TestService()]);

        let hi = await doGet('/hi');
        expect(hi).equals('hello!');

        await doPost('/hi', {message : 'updated_message'});
        hi = await doGet('/hi');
        expect(hi).equals('updated_message');
    }));

    it('sending an object as body in a POST method',  mochaAsync(async () => {

        interface TestEntity{
            name: string;
            id: string;
        }

        class TestService {
            data: TestEntity;
            @POST('/entity') setData(data: TestEntity): void { this.data = data; }
        }

        let service = new TestService();

        await startServer([service]);

        let entity = { name: 'entity', id: '101'};
        await doPost('/entity', entity);

        expect(entity).deep.equal(service.data);
    }));

    it('headers are passed to the method',  mochaAsync(async () => {

        class TestService {
            @GET('/header_data/:id', ['query'], ['header1', 'header2'])
            dataWithHeaders(id: string, query: string, header1: string, header2: string): string {
                if (id == 'myId' && query == 'myQuery' && header1 == 'myHeader1' && header2 == 'myHeader2') {
                    return 'pong';
                } else {
                    throw new Error('unknown input');
                }
            }
        }

        await startServer([new TestService()]);

        let fetchedData = await doGet('/header_data/myId?query=myQuery',{header1:'myHeader1',header2:'myHeader2'});
        expect(fetchedData).equals('pong');
    }));
});




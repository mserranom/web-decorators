import {GET,} from '../src/express_decorators';
import {doGet, startServer, stopServer, mochaAsync} from './test_utils'

import {expect} from 'chai';

import {Readable} from 'stream'
import {Buffer} from 'buffer'

describe('return value unwrapping', () => {

    afterEach( () => {
        stopServer();
    });

    it('an undefined result should be unwrapped to an empty string', mochaAsync(async () => {

        class TestService {
            @GET('/undefined')
            undefinedResult() {
                return undefined;
            }
        }

        await startServer([new TestService()]);

        let result = await doGet('/undefined');
        expect(result).equal('');
    }));

    it('a null result should be unwrapped to an empty string', mochaAsync(async () => {

        class TestService {
            @GET('/null')
            nullResult() {
                return null;
            }
        }

        await startServer([new TestService()]);

        let result = await doGet('/null');
        expect(result).equal('');
    }));

    it('promise result should be sent to response', mochaAsync(async () => {

        class TestService {
            @GET('/entity')
            getPromisedEntity() {
                return new Promise((resolve) => setTimeout(() => resolve({id : '101', name: 'entity'}), 1));
            }
        }

        await startServer([new TestService()]);

        let fetchedEntity = await doGet('/entity');
        expect(JSON.parse(fetchedEntity)).deep.equal({id : '101', name: 'entity'});
    }));


    it('returned readable streams should be piped to the response', mochaAsync(async () => {

        class TestService {
            @GET('/stream_data')
            getEntity() {
                let stream = new Readable();
                stream._read = function noop() {}; // redundant?
                stream.push('data piped correctly!');
                stream.push(null);
                return stream;
            }
        }

        await startServer([new TestService()]);

        let result = await doGet('/stream_data');
        expect(result).equal('data piped correctly!');
    }));

    it('returned buffer content should be sent to response', mochaAsync(async () => {

        class TestService {
            @GET('/buffered_data')
            getEntity() {
               return new Buffer('buffer sent correctly!');
            }
        }

        await startServer([new TestService()]);

        let result = await doGet('/buffered_data');
        expect(result).equal('buffer sent correctly!');
    }));
});




import {GET, POST, Middleware} from '../../src/express_decorators';
import {doPost, startServer, stopServer, mochaAsync} from '../test_utils'

import {expect} from 'chai';


// ---------
// TEST DATA
// ---------

let emptyMiddleware = (req, res, next) => next();

function zeroIdCheckMiddleware(req, res, next) {
    let body = req.body;
    if (body['id'] === '0') {
        res.status(413).send('id is zero');
    } else {
        next();
    }
}

function nameNullCheckMiddleware(req, res, next) {
    let body = req.body;
    if (body['name'] === null) {
        res.status(414).send('id is null');
    } else {
        next();
    }

}

export class TestEntity {
    name: string = 'entity';
    id: string = '101';
}

@Middleware(nameNullCheckMiddleware)
export class TestService {

    private data: TestEntity = new TestEntity();

    @POST('/entities')
    @Middleware([emptyMiddleware, zeroIdCheckMiddleware, emptyMiddleware])
    setData(data: TestEntity): void {
        this.data = data;
    }

    @GET('/entities/:id')
    getData(id: string): TestEntity {
        return (this.data.id === id) ? this.data : undefined;
    }

    @GET('/header_data/:id', ['query'], ['header1', 'header2'])
    dataWithHeaders(id: string, query: string, header1: string, header2: string): string {
        if (id == 'myId' && query == 'myQuery' && header1 == 'myHeader1' && header2 == 'myHeader2') {
            return 'pong';
        } else {
            throw new Error('unknown input');
        }
    }
}

// ---------
// SPEC
// ---------

describe('middleware', () => {

    beforeEach(mochaAsync(async () => {
        await startServer([new TestService()]);
    }));

    afterEach(() => {
        stopServer();
    });

    it('method-level defined middleware can fail request',  mochaAsync(async () => {

        let newEntity = new TestEntity();
        newEntity.id = '0';

        try {
            await doPost('/entities', newEntity);
        } catch(error) {
            expect(error.statusCode).equal(413);
            return;
        }

        expect(true).equals(false);
    }));

    it('class-level defined middleware can fail request',  mochaAsync(async () => {

        let newEntity = new TestEntity();
        newEntity.name = null;

        try {
            await doPost('/entities', newEntity);
        } catch(error) {
            expect(error.statusCode).equal(414);
            return;
        }

        expect(true).equals(false);
    }));

    it('class-level middleware is executed before method-level middleware',  mochaAsync(async () => {

        let newEntity = new TestEntity();
        newEntity.id = '0';
        newEntity.name = null;

        try {
            await doPost('/entities', newEntity);
        } catch(error) {
            expect(error.statusCode).equal(414);
            return;
        }

        expect(true).equals(false);
    }));

});




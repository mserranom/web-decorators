import {RequestMapping, Route, Middleware, GET, POST} from '../src/express_decorators';

let emptyMiddleware = (req, res, next) => next();

function zeroIdCheckMiddleware(req, res, next) {
    let body = req.body;
    if (body['id'] === '0') {
        res.status(413).send('id is zero');
    }
    next();
}

function nameNullCheckMiddleware(req, res, next) {
    let body = req.body;
    if (body['name'] === null) {
        res.status(414).send('id is null');
    }
    next();
}

export class TestEntity {
    name: string = 'entity';
    id: string = '101';
}

@Middleware(nameNullCheckMiddleware)
export class TestEndpoint {

    private data: TestEntity = new TestEntity();

    @RequestMapping('POST', '/entities')
    @Middleware([emptyMiddleware, zeroIdCheckMiddleware, emptyMiddleware])
    setData(data: TestEntity): void {
        this.data = data;
    }

    @RequestMapping('GET', '/entities/:id')
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

@Route('/hi')
@Middleware(emptyMiddleware)
export class TestEndpoint2 {

    private message = 'hello!';

    @RequestMapping('get')
    @Middleware([emptyMiddleware])
    getMessage(): string {
        return this.message;
    }

    @POST()
    setMessage(message: string): void {
        this.message = message;
    }

}

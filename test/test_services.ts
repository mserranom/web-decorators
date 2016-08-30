import {RequestMapping, Route, Middleware, GET, POST} from '../src/express_decorators';
import {Readable} from 'stream'

async function sleep(ms:number) : Promise<any> {
    return new Promise<void>(function(resolve) {
        setTimeout(function(){ resolve() }, ms);
    });
}

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

    @RequestMapping('GET', '/async_entities/:id')
    async getAsyncData(id: string): Promise<TestEntity> {
        await sleep(1);
        return (this.data.id === id) ? this.data : undefined;
    }

    @RequestMapping('GET', '/wrong')
    throwError(): TestEntity {
        throw new Error('error thrown');
    }

    @RequestMapping('GET', '/wrong_async')
    async throwAsyncError(): Promise<void> {
        await sleep(1);
        throw new Error('error thrown');
    }

    @RequestMapping('GET', '/stream_data')
    pipeData(): Readable {
        let stream = new Readable();
        stream._read = function noop() {
        }; // redundant? see update below
        stream.push('data piped correctly!');
        stream.push(null);
        return stream;
    }

    @RequestMapping('get', '/numbers/:id', ['from', 'to'])
    sliceNumbers(id: string, from: number, to: number): Array<number> {
        let data = [3, 4, 5, 6, 7];
        if (id == '101') {
            return data.slice(from, to);
        } else {
            throw new Error('unknown id');
        }
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

# web-decorators
Typescript and ES2016 Decorators for Web Framework Configuration.

[![Build Status](https://travis-ci.org/mserranom/web-decorators.svg?branch=master)](https://travis-ci.org/mserranom/web-decorators) [![npm version](https://badge.fury.io/js/web-decorators.svg)](https://badge.fury.io/js/web-decorators)

## Features
 * Routing and Middleware wiring using Decorators
 * Unfolding of Parameters and Headers
 * Promises and Stream support
 * Sync/Async Error Handling

### Routing and Middleware wiring using Decorators

```typescript
@Route('/hello')
class HelloService {

    @GET('world')
    helloWorld() : string {
        return 'hello world!';
    }

    @GET('user/:name')
    helloUser(name : string) : void {
        return 'hello ${name}!';
    }

    @POST('log')
    @Middleware(messageNotNullMiddleware)
    logMessage(message : string) : void {
        console.log(message);
    }
}

function messageNotNullMiddleware(req, res, next) {
    if(!req.body.message) {
        res.status(400).send('a message is required');
    }
    next();
}
```


### Parameter Unfolding

#### Route Parameters Unfolding
```typescript
@GET('greet/:user')
logMessage(user : string) : void { ... }

request.get('http://localhost:8080/examples/greet/bill');
```

#### Request Parameters Unfold
```typescript
@GET('user',['age_under', 'age_over'])
logMessage(ageUnder : number, ageOver : number) : void { ... }

request.get('http://localhost:8080/examples/user?age_over=18&age_under=35');
```

#### Body Unfold
```typescript
@POST('/user')
createUser(info : UserInfo) : void { ... }

request.post('http://localhost:8080/examples/log', body: { name: 'John Doe', age: 33 }, json: true);

Body Unfold is only present on POST and DELETE requests [link 1](http://stackoverflow.com/questions/978061/http-get-with-request-body)
[link 2] (http://stackoverflow.com/questions/299628/is-an-entity-body-allowed-for-an-http-delete-request)

#### Header Unfold
```typescript
@GET('/user', [], ['token'])
logMessage(token : string) : void { ... }

request.post('http://localhost:8080/examples/user', headers: { token: 'htrv3qn4'});
```

#### All Combined
```typescript
@GET('/user/:id', ['param1', 'param2'], ['header1', 'header2'])
userByIdQueryAndHeaders(id: string, param1: string, param2: string, header1: string, header2: string) : void { ... }

request.get('http://localhost:8080/examples/user/bill?param1=value&param2=value',
                  headers: { header1: 'value', header2: 'value'});

@POST('/user', ['header1', 'header2'])
createUser(info: UserInfo, header1: string, header2: string) : void { ... }

request.post('http://localhost:8080/examples/user body: { name: 'John Doe', age: 33 }, json: true
                  headers: { header1: 'value', header2: 'value'});
```




## API
```typescript

import {configureRoutes, Route, Middleware, GET, POST} from '../src/express_decorators';
import {request} from 'request';
import * as express from 'express';


app = express();
app.use(bodyParser.json()); // required

app.listen(port, () =>  configureRoutes(app, [HelloService, ExamplesService]));


function messageNotNull(req, res) {
    if(!req.body.message) {
        res.status(400).send('a message is required');
    }
    next();
}

@Route('/hello')
class HelloService {

    private var message = 'message';

    @GET('world')
    getMessage() : string {
        return 'hello world!';
    }

    @POST('message')
    @Middleware(messageNotNull)
    setMessage(message : string) : void {
        this.message = message;
    }

    @GET('message')
    getMessage() : void {
        return 'hello ${message}!';
    }
}

@Route('/examples')
class ExamplesService {

    @GET('streamed_data')
    getStreamedData() : Readable {
        let stream = new Readable();
        stream.push('data piped correctly!');
        stream.push(null);
        return stream;
    }

    private function urlNotNull(req, res) {
        if(!req.body.message) {
            res.status(400).send('a url is required');
        }
        next();
    }

    @GET('proxy')
    @Middleware(urlNotNull)
    getProxy(url) : Readable {
        return request(url);
    }



    @POST('hello_promise')
    @Middleware(messageNotNull)
    setMessage(message : string) : void {
        return new Promise<String>(resolve => setTimeout(() => resolve('hello promise!'), 10));
    }

    function sleep(ms:number) : Promise<any> {
        return new Promise<void>(function(resolve) {
            setTimeout(function(){ resolve() }, ms);
        });
    }

    @GET('hello_async')
    async getAsyncData(id : string) : TestEntity {
        await sleep(1);
        return 'hello async!';
    }
}

```


## Building

```
npm install && npm test
```

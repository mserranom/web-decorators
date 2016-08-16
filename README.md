# web-decorators
Typescript and ES2016 Decorators for Web Framework Configuration.

[![Build Status](https://travis-ci.org/mserranom/web-decorators.svg?branch=master)](https://travis-ci.org/mserranom/web-decorators) [![npm version](https://badge.fury.io/js/web-decorators.svg)](https://badge.fury.io/js/web-decorators)

## Features
 * Express Route wiring using Decorators
 * Parameter Boxing/Unboxing
 * Promises and Stream support
 * Sync/Async Error Handling

## API
```typescript

import {Route, Middleware, GET, POST} from '../src/express_decorators';
import {request} from 'request';

function messageNotNull(req, res) {
    if(!req.body.message) {
        res.status(400).send('a message is required');
    }
    next();
}

@Route('/hello')
class MyEndpoint {

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
class MyEndpoint {

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

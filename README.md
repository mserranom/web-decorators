# web-decorators
Typescript and ES2016 Decorators for Web Framework Configuration.

[![Build Status](https://travis-ci.org/mserranom/web-decorators.svg?branch=master)](https://travis-ci.org/mserranom/web-decorators) [![npm version](https://badge.fury.io/js/web-decorators.svg)](https://badge.fury.io/js/web-decorators)

## Features
 * Express Route wiring using Decorators
 * Promises and Stream support

## API
```typescript

import {Route, Middleware, GET, POST} from '../src/express_decorators';

function messageNotNull(req, res) {
    if(!req.body.message) {
        res.status(400).send('a message is required');
    }
    next();


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

```


## Building

```
npm install && npm test
```

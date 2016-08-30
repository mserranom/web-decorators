import {Request, Response} from 'express';
import {Stream, Readable} from 'stream';

// ------------------
// DATA TYPES
// ------------------


interface EndpointConfig {
    method : string;
    route : string;
    handler : string;
    params : Array<string>;
    query : Array<string>;
    headers : Array<string>;
}

interface DecoratorConfig {
    endpoints : Array<EndpointConfig>;
    route : string;
    middleware : Array<any>
    endpointMiddleware : Map<string, Array<any>>
}

function resolveDecoratorConfig(target : any) : DecoratorConfig {
    const DECORATORS_PROP = '__web__decorators__config';
    target[DECORATORS_PROP] = target[DECORATORS_PROP]
        || { endpoints : [], route : '', query : [] , middleware : [], endpointMiddleware : new Map(), headers : []};
    return target[DECORATORS_PROP];
}




// ------------------
// DECORATORS
// ------------------


export function Route(route : string) {

    return function (target:any) {

        let config : DecoratorConfig = resolveDecoratorConfig(target.prototype);

        config.route = route;
    }
}

export const GET = (route? : string, queryParams? : Array<string>, headers? : Array<string>) =>
    RequestMapping('get', route, queryParams, headers);
export const POST = (route? : string, queryParams? : Array<string>, headers? : Array<string>) =>
    RequestMapping('post', route, queryParams, headers);
export const PUT = (route? : string, queryParams? : Array<string>, headers? : Array<string>) =>
    RequestMapping('put', route, queryParams, headers);
export const DELETE = (route? : string, queryParams? : Array<string>, headers? : Array<string>) =>
    RequestMapping('delete', route, queryParams, headers);

export function RequestMapping(method: string, route? : string, queryParams? : Array<string>, headers? : Array<string>) {

    route = route || '';
    queryParams = queryParams || [];
    headers = headers || [];

    return function (target:any, propertyKey:any) {

        let config : DecoratorConfig = resolveDecoratorConfig(target);

        config.endpoints.push({
            method : method.toLowerCase(),
            route : route,
            params : extractRouteParams(route),
            query : queryParams,
            headers : headers,
            handler : propertyKey,
        });
    }
}

function extractRouteParams(route : string) : Array<string> {
    if(!route) {
        return [];
    } else {
        return route.split('/')
            .filter(x => x.charAt(0) == ':')
            .map(x => x.substring(1));
    }
}

export function Middleware(middleware: any | Array<any>) {

    return function (target:any, propertyKey?:any) {

        if(propertyKey) {
            let config : DecoratorConfig =  resolveDecoratorConfig(target);
            config.endpointMiddleware.set(propertyKey, [].concat(middleware))
        } else {
            let config : DecoratorConfig =  resolveDecoratorConfig(target.prototype);
            config.middleware = [].concat(middleware);
        }
    }
}


// ------------------
// RUNTIME
// ------------------


export function configureObject(target : any, app) {

    let config = resolveDecoratorConfig(target);

    let configureEndpoint = (endpoint : EndpointConfig) => {

        let requestHandler = (req : Request, response : Response) => {
            let args = endpoint.params.map(x => req.params[x]);

            args = args.concat(endpoint.query.map(x => req.query[x]));
            args = args.concat(endpoint.headers.map(x => req.get(x)));

            let body = unwrapBody(req.body);

            if(body) {
                args.push(body);
            }

            let handler = target[endpoint.handler];

            let result;

            try {
                result = handler.apply(target, args);
            } catch(error) {
                let wrappedError = wrapErrorBody(error); //TODO: this error handler should be configurable
                console.error('Request Error: ' + JSON.stringify(wrappedError));
                response.status(500).send(wrappedError);
                return;
            }


            if(isPromise(result)) {

                let promise : Promise<any> = result;
                promise.then(x => response.send(x))
                       .catch(error => {
                           let wrappedError = wrapErrorBody(error); //TODO: this error handler should be configurable
                           console.error('Request Error: ' + JSON.stringify(wrappedError));
                           response.status(500).send(wrappedError);
                       });

            } else if(isReadableStream(result)) {

                let readableStream : Readable = result;
                readableStream.pipe(response);

            } else {
                response.send(result);
            }
        };

        let args : Array<any> = [config.route + endpoint.route].concat(config.middleware);

        if(config.endpointMiddleware.has(endpoint.handler)) {
            args = args.concat(config.endpointMiddleware.get(endpoint.handler));
        }

        args.push(requestHandler);

        app[endpoint.method].apply(app, args);
    };

    config.endpoints.forEach(x => configureEndpoint(x));
}

function isPromise(object : any) : boolean {
    if(!object) {
        return false;
    } else {
        return typeof object === 'object' && typeof object.then === 'function';
    }
}

function isReadableStream(obj) {
    return obj instanceof Stream &&
        typeof (obj['_read'] === 'function') &&
        typeof (obj['_readableState'] === 'object');
}


function unwrapBody(body : any) : any {
    if(body === null || body === undefined) {
        return undefined;
    }

    if(Object.getOwnPropertyNames(body).length === 1 && body.hasOwnProperty('message')) {
        return body['message']
    } else {
        return body;
    }
}

function wrapErrorBody(body : any) : any {
    //TODO: [Object object] might not be the best way to check this when the method is overriden
    if(body.toString() == '[object Object]' && isStringifiable(body)) {
        return body;
    } else {
        return {message : '' + body};
    }

}

function isStringifiable(obj : any) : boolean {
    try {
        JSON.stringify(obj);
        return true;
    } catch (error) {
        return false;
    }
}




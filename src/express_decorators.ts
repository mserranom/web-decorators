import {Request, Response} from 'express';
import {Stream, Readable} from 'stream';
import {Buffer} from 'buffer';

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

interface ServiceConfig {
    endpoints : Array<EndpointConfig>;
    route : string;
    middleware : Array<any>;
    errorHandler : Array<any>
    endpointMiddleware : Map<string, Array<any>>;
    endpointErrorHandler : Map<string, Array<any>>
}

function resolveServiceConfig(service : any) : ServiceConfig {
    const DECORATORS_PROP = '__web__decorators__config';
    service[DECORATORS_PROP] = service[DECORATORS_PROP]
        || { endpoints : [],
            route : '',
            middleware : [],
            errorHandler : [],
            endpointMiddleware : new Map(),
            endpointErrorHandler : new Map() };
    return service[DECORATORS_PROP];
}




// ------------------
// DECORATORS
// ------------------


export function Route(route : string) {

    return function (target:any) {
        let config : ServiceConfig = resolveServiceConfig(target.prototype);
        if(route === '/') {
            config.route = ''; // to prevent 2 slashes when joining service route + endpoint route
        } else {
            config.route = (route.charAt(0) === '/') ? route : '/' + route;
        }
    }
}

export const GET = (route? : string, queryParams? : Array<string>, headers? : Array<string>) =>
    Endpoint('get', route, queryParams, headers);
export const POST = (route? : string, queryParams? : Array<string>, headers? : Array<string>) =>
    Endpoint('post', route, queryParams, headers);
export const PUT = (route? : string, queryParams? : Array<string>, headers? : Array<string>) =>
    Endpoint('put', route, queryParams, headers);
export const DELETE = (route? : string, queryParams? : Array<string>, headers? : Array<string>) =>
    Endpoint('delete', route, queryParams, headers);

export function Endpoint(method: string, route? : string, queryParams? : Array<string>, headers? : Array<string>) {

    route = route || '';
    queryParams = queryParams || [];
    headers = headers || [];

    return function (target:any, propertyKey:any) {

        let config : ServiceConfig = resolveServiceConfig(target);

        config.endpoints.push({
            method : method.toLowerCase(),
            route : (route.charAt(0) === '/') ? route : '/' + route,
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
            let config : ServiceConfig =  resolveServiceConfig(target);
            config.endpointMiddleware.set(propertyKey, [].concat(middleware))
        } else {
            let config : ServiceConfig =  resolveServiceConfig(target.prototype);
            config.middleware = [].concat(middleware);
        }
    }
}

export function ErrorHandler(errorHandler: any | Array<any>) {

    return function (target:any, propertyKey?:any) {

        if(propertyKey) {
            let config : ServiceConfig =  resolveServiceConfig(target);
            config.endpointErrorHandler.set(propertyKey, [].concat(errorHandler))
        } else {
            let config : ServiceConfig =  resolveServiceConfig(target.prototype);
            config.errorHandler = [].concat(errorHandler);
        }
    }
}


// ------------------
// RUNTIME
// ------------------

function errorHandler(error, request, response, next) {
    //TODO: investigate, could we rely on the default error handler instead?
    response.status(500).send(wrapErrorBody(error));
}

function wrapErrorBody(body : any) : any {
    body = body ? body : '';

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

export function configureExpressService(target : any, app) {

    let serviceConfig = resolveServiceConfig(target);

    let configureEndpoint = (endpoint : EndpointConfig) => {

        let requestHandler = (req : Request, response : Response, next : any) => {

            const restifyResponse : any = response;
            restifyResponse['contentType'] = 'text/plain';

            let isFunction = (obj) => obj && obj.constructor && obj.call && obj.apply;

            let getHeader = (x) => isFunction(req.header) ? req.header(x) : req.get(x); // restify & express header

            let args = endpoint.params.map(x => req.params[x])
                .concat(endpoint.query.map(x => req.query[x]))
                .concat(endpoint.headers.map(x => getHeader(x)));

            let body = unwrapBody(req.body);
            body && args.push(body);

            let result;

            try {
                let handler = target[endpoint.handler];
                result = handler.apply(target, args);
            } catch(error) {
                next(error ? error : 'unhandled exception');
                return;
            }

            result = result ? result : '';

            if(isPromise(result)) {
                let promise : Promise<any> = result;
                promise.then(x => response.send(x))
                       .catch(error => {
                           next(error ? error : 'promise rejected')
                       });

            } else if(isReadableStream(result)) {
                let readableStream : Readable = result;
                readableStream.pipe(response);

            } else if (Buffer.isBuffer(result)) {
                response.send(result.toString())
            } else {
                response.send(result);
            }
        };

        let args : Array<any> = [serviceConfig.route + endpoint.route].concat(serviceConfig.middleware);


        if(serviceConfig.endpointMiddleware.has(endpoint.handler)) {
            args = args.concat(serviceConfig.endpointMiddleware.get(endpoint.handler));
        }

        args.push(requestHandler);

        args = args.concat(serviceConfig.errorHandler);

        if(serviceConfig.endpointErrorHandler.has(endpoint.handler)) {
            args = args.concat(serviceConfig.endpointErrorHandler.get(endpoint.handler));
        }

        args.push(errorHandler);

        app[endpoint.method].apply(app, args);
    };

    serviceConfig.endpoints.forEach(x => configureEndpoint(x));
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
    } else if(Object.getOwnPropertyNames(body).length === 1 && body.hasOwnProperty('message')) {
        return body['message']
    } else {
        return body;
    }
}






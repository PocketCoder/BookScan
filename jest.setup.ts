import "@testing-library/jest-dom";

// Polyfill global Request and Response for Next.js API route tests
if (typeof global.Request === 'undefined') {
    global.Request = class Request {
        constructor(public url: string, public init?: RequestInit) { }
    } as any;
}

if (typeof global.Response === 'undefined') {
    global.Response = class Response {
        constructor(public body?: any, public init?: ResponseInit) { }
    } as any;
}

if (typeof global.Headers === 'undefined') {
    global.Headers = class Headers extends Map {
        constructor() {
            super();
        }
    } as any;
}


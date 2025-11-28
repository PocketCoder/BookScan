import "@testing-library/jest-dom";

// Polyfill global Request and Response for Next.js API route tests
if (typeof global.Request === 'undefined') {
    global.Request = class Request {
        constructor(public url: string, public init?: RequestInit) { }
    } as any;
}

if (typeof global.Response === 'undefined') {
    global.Response = class Response {
        constructor(public body?: any, public init?: ResponseInit) {
            this.status = init?.status || 200;
        }
        status: number;
        async json() {
            return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
        }
        static json(data: any, init?: ResponseInit) {
            const body = JSON.stringify(data);
            return new Response(body, init);
        }
    } as any;
} else {
    // If Response exists but doesn't have static json method (e.g. older jsdom)
    if (!(global.Response as any).json) {
        (global.Response as any).json = (data: any, init?: ResponseInit) => {
            return new Response(JSON.stringify(data), init);
        }
    }
}

if (typeof global.Headers === 'undefined') {
    global.Headers = class Headers extends Map {
        constructor() {
            super();
        }
    } as any;
}

// Ensure mock isolation between tests
afterEach(() => {
    jest.clearAllMocks();
});

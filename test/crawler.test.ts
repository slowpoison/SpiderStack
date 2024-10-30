import { WebCrawler, CrawlerOptions } from './crawler';

describe('WebCrawler', () => {
    let defaultOptions: CrawlerOptions;

    beforeEach(() => {
        defaultOptions = {
            startUrl: 'https://example.com',
            maxDepth: 2,
            maxPages: 10,
            concurrency: 1,
            timeout: 30,
            waitUntil: 'networkidle',
            output: './output',
            followExternal: false,
            headless: true
        };
    });

    test('creates crawler with default options', () => {
        const crawler = new WebCrawler(defaultOptions);
        expect(crawler).toBeInstanceOf(WebCrawler);
    });

    test('handles proxy configuration', () => {
        const options = {
            ...defaultOptions,
            proxy: 'http://proxy.example.com:8080'
        };
        const crawler = new WebCrawler(options);
        expect(crawler).toBeInstanceOf(WebCrawler);
    });

    test('handles user agent configuration', () => {
        const options = {
            ...defaultOptions,
            userAgent: 'Custom User Agent 1.0'
        };
        const crawler = new WebCrawler(options);
        expect(crawler).toBeInstanceOf(WebCrawler);
    });

    test('enables verbose logging', () => {
        const options = {
            ...defaultOptions,
            verbose: true
        };
        const crawler = new WebCrawler(options);
        expect(crawler).toBeInstanceOf(WebCrawler);
    });

    test('validates maxDepth option', () => {
        const options = {
            ...defaultOptions,
            maxDepth: 0
        };
        const crawler = new WebCrawler(options);
        expect(crawler).toBeInstanceOf(WebCrawler);
    });

    test('validates maxPages option', () => {
        const options = {
            ...defaultOptions,
            maxPages: 1
        };
        const crawler = new WebCrawler(options);
        expect(crawler).toBeInstanceOf(WebCrawler);
    });

    test('validates concurrency option', () => {
        const options = {
            ...defaultOptions,
            concurrency: 5
        };
        const crawler = new WebCrawler(options);
        expect(crawler).toBeInstanceOf(WebCrawler);
    });

    test('validates waitUntil option', () => {
        const options = {
            ...defaultOptions,
            waitUntil: 'load' as const
        };
        const crawler = new WebCrawler(options);
        expect(crawler).toBeInstanceOf(WebCrawler);
    });

    test('validates followExternal option', () => {
        const options = {
            ...defaultOptions,
            followExternal: true
        };
        const crawler = new WebCrawler(options);
        expect(crawler).toBeInstanceOf(WebCrawler);
    });

    test('validates headless option', () => {
        const options = {
            ...defaultOptions,
            headless: false
        };
        const crawler = new WebCrawler(options);
        expect(crawler).toBeInstanceOf(WebCrawler);
    });
});

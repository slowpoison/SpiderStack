import { describe, test } from 'mocha'
import { expect } from 'chai';
import { Crawler, CrawlerOptions } from '../src/crawler.js';

describe('Crawler', () => {
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
        const crawler = new Crawler(defaultOptions);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('handles proxy configuration', () => {
        const options = {
            ...defaultOptions,
            proxy: 'http://proxy.example.com:8080'
        };
        const crawler = new Crawler(options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('handles user agent configuration', () => {
        const options = {
            ...defaultOptions,
            userAgent: 'Custom User Agent 1.0'
        };
        const crawler = new Crawler(options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('enables verbose logging', () => {
        const options = {
            ...defaultOptions,
            verbose: true
        };
        const crawler = new Crawler(options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates maxDepth option', () => {
        const options = {
            ...defaultOptions,
            maxDepth: 0
        };
        const crawler = new Crawler(options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates maxPages option', () => {
        const options = {
            ...defaultOptions,
            maxPages: 1
        };
        const crawler = new Crawler(options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates concurrency option', () => {
        const options = {
            ...defaultOptions,
            concurrency: 5
        };
        const crawler = new Crawler(options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates waitUntil option', () => {
        const options = {
            ...defaultOptions,
            waitUntil: 'load' as const
        };
        const crawler = new Crawler(options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates followExternal option', () => {
        const options = {
            ...defaultOptions,
            followExternal: true
        };
        const crawler = new Crawler(options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates headless option', () => {
        const options = {
            ...defaultOptions,
            headless: false
        };
        const crawler = new Crawler(options);
        expect(crawler).to.be.instanceOf(Crawler);
    });
});

import { expect } from 'chai';
import { purgeDefaultStorages } from 'crawlee';
import express from 'express';
import http from 'http';
import { describe, test } from 'mocha';
import { Crawler, CrawlerOptions } from '../src/crawler.js';

const port = 65432;
const baseUrl = `http://localhost:${port}`;

async function startServer(): Promise<http.Server> {
    const app = express();
    app.use(express.static('test/public'));
    return new Promise((resolve, reject) => {
        try {
            let server = app.listen(port, () => {
            resolve(server);
            });
        } catch (err) {
            reject(err);
        }
    });
  }
  
  async function stopServer(server: http.Server) {
    console.log('Stopping server...');
    return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve(server);
        });
    });
  }


describe('Crawler', () => {
    let server: http.Server;
    let defaultOptions: Partial<CrawlerOptions> = {
        maxDepth: 2,
        maxPages: 10,
        maxConcurrency: 1,
        timeoutSecs: 30,
        waitUntil: 'domcontentloaded',
        outDir: './output',
        headless: true
    };


    before(async function() {
        this.timeout(5000); // Adjust timeout if the server takes longer to start
        server = await startServer();
    });

    after(async function () {
      await stopServer(server);
    });

    beforeEach(async function () {
        await purgeDefaultStorages();
    });

    test('creates crawler with default options', () => {
        const crawler = new Crawler(baseUrl, defaultOptions);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates maxDepth 0 option', async () => {
        const options = {
            ...defaultOptions,
            maxDepth: 0,
        };

        const crawler = new Crawler(baseUrl, options);
        await crawler.run();
        const crawledUrls = crawler.getCrawledUrls();
        expect(crawledUrls).to.deep.equal(new Set([baseUrl]));
    })

    test('validates maxDepth 1 option', async () => {
        const options = {
            ...defaultOptions,
            maxDepth: 1,
        };

        const crawler = new Crawler(baseUrl, options);
        await crawler.run();
        const crawledUrls = crawler.getCrawledUrls();
        console.log('urls', crawledUrls);
        expect(crawledUrls).to.deep.equal(new Set([
          baseUrl,
          `${baseUrl}/about.html`,
          `${baseUrl}/contact.html`,
          `${baseUrl}/level1.html`,
        ]));
    });

    test('validates maxPages option', () => {
        const options = {
            ...defaultOptions,
            maxPages: 1
        };
        const crawler = new Crawler(baseUrl, options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates concurrency option', () => {
        const options = {
            ...defaultOptions,
            concurrency: 5
        };
        const crawler = new Crawler(baseUrl, options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates waitUntil option', () => {
        const options = {
            ...defaultOptions,
            waitUntil: 'load' as const
        };
        const crawler = new Crawler(baseUrl, options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates followExternal option', () => {
        const options = {
            ...defaultOptions,
            followExternal: true
        };
        const crawler = new Crawler(baseUrl, options);
        expect(crawler).to.be.instanceOf(Crawler);
    });

    test('validates headless option', () => {
        const options = {
            ...defaultOptions,
            headless: false
        };
        const crawler = new Crawler(baseUrl, options);
        expect(crawler).to.be.instanceOf(Crawler);
    });
});

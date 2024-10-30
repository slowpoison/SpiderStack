import { runCrawler } from '../crawler-utils';

describe('Crawler', () => {
    it('should crawl a website with custom options', async () => {
        const result = await runCrawler({
            startUrl: 'https://example.com',
            maxDepth: 2,
            maxPages: 10,
            concurrency: 1,
            timeout: 30,
            waitUntil: 'domcontentloaded',
            output: 'test-results',
            followExternal: false,
            headless: true,
            verbose: true
        });

        expect(result.success).toBe(true);
        expect(result.outputPath).toBe('test-results');
    });
});

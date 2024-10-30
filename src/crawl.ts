import { program } from 'commander';
import { Dataset, EnqueueLinksOptions, log, Log, PlaywrightCrawler, Request } from 'crawlee';
import { Page } from 'playwright';

// Configure CLI options
program
    .name('crawl')
    .description('Configurable web crawler built with Crawlee')
    .argument('<startUrl>', 'Starting URL to crawl')
    .option('-d, --max-depth <number>', 'Maximum crawl depth', '3')
    .option('-p, --max-pages <number>', 'Maximum number of pages to crawl', '100')
    .option('-c, --concurrency <number>', 'Number of concurrent requests', '10')
    .option('-t, --timeout <number>', 'Navigation timeout in seconds', '30')
    .option('-w, --wait-until <event>', 'When to consider navigation finished: domcontentloaded, load, networkidle', 'domcontentloaded')
    .option('-o, --output <path>', 'Output dataset name', 'crawler-results')
    .option('--follow-external', 'Follow links to external domains', false)
    .option('--headless', 'Run browser in headless mode', true)
    .option('--proxy <url>', 'Proxy URL to use')
    .option('--user-agent <string>', 'Custom user agent string')
    .option('-v, --verbose', 'Enable verbose logging')
    .parse();

const options = program.opts();
const startUrl = program.args[0];

if (options.verbose) {
    log.setLevel(log.LEVELS.DEBUG);
}

// Helper function to check if URL is external
function isExternalUrl(baseUrl: string, urlToCheck: string) {
    const baseHostname = new URL(baseUrl).hostname;
    const urlHostname = new URL(urlToCheck).hostname;
    return baseHostname !== urlHostname;
}

// Create crawler configuration
const crawlerConfig = {
    // Browser configuration
    headless: options.headless,
    maxConcurrency: parseInt(options.concurrency),
    navigationTimeoutSecs: parseInt(options.timeout),
    requestHandlerTimeoutSecs: parseInt(options.timeout) * 2,

    // Optional proxy configuration
    ...(options.proxy && {
        proxyUrl: options.proxy
    }),

    // Browser context configuration
    browserPoolOptions: {
        useFingerprints: true, // Enables browser fingerprinting
        ...(options.userAgent && {
            defaultUserAgent: options.userAgent
        })
    },

    // Initial setup before crawling starts
    async requestHandler({ request, page, enqueueLinks, log }: { request: Request, page: Page, enqueueLinks: (options?: EnqueueLinksOptions) => Promise<unknown> , log: Log }) {
        const { url, userData: { depth = 0 } } = request;
        log.info(`Crawling ${url} (depth: ${depth})`);

        try {
            // Wait for the specified navigation event
            await page.waitForLoadState(options.waitUntil);

            // Extract page title and metadata
            const title = await page.title();
            const metadata = await page.evaluate(() => {
                const metaTags: { [key: string]: string } = {};
                document.querySelectorAll('meta').forEach(meta => {
                    const name = meta.getAttribute('name') || meta.getAttribute('property');
                    const content = meta.getAttribute('content');
                    if (name && content) {
                        metaTags[name] = content;
                    }
                });
                return metaTags;
            });

            // Save the results
            await Dataset.pushData({
                url,
                title,
                depth,
                metadata,
                timestamp: new Date().toISOString()
            });

            // Don't enqueue more if we've reached max depth
            if (depth >= parseInt(options.maxDepth)) {
                log.debug(`Reached max depth at ${url}`);
                return;
            }

            // Enqueue links found on the page
            await enqueueLinks({
                strategy: 'same-domain',
                transformRequestFunction: (req) => {
                    // Skip external URLs if not explicitly allowed
                    if (!options.followExternal && isExternalUrl(startUrl, req.url)) {
                        return false;
                    }
                    // Add depth information to the request
                    (req as any).userData = { depth: depth + 1 };
                    return req;
                }
            });

        } catch (error: any) {
            log.error(`Failed to crawl ${url}: ${error.message}`);
        }
    },
    // Configure failure handling
    failedRequestHandler({ request, log }: { request: Request, log: Log }) {
        log.error(`Request ${request.url} failed`);
    },

    // Additional configuration
    maxRequestsPerCrawl: parseInt(options.maxPages),
};

// Run the crawler
try {
    const crawler = new PlaywrightCrawler(crawlerConfig);
    
    // Print start message
    console.log(`Starting crawler with following configuration:
- Start URL: ${startUrl}
- Max depth: ${options.maxDepth}
- Max pages: ${options.maxPages}
- Concurrency: ${options.concurrency}
- Output: ${options.output}
- Follow external: ${options.followExternal}
`);

    await crawler.run([startUrl]);
    
    console.log('Crawling finished successfully!');
    console.log(`Results saved to: ${options.output}`);
} catch (error) {
    console.error('Crawler failed:', error);
    process.exit(1);
}

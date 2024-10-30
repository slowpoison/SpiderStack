import { Dataset, EnqueueLinksOptions, log, Log, PlaywrightCrawler, Request } from 'crawlee';
import { Page } from 'playwright';

export interface CrawlerOptions {
    startUrl: string;
    maxDepth: number;
    maxPages: number;
    concurrency: number;
    timeout: number;
    waitUntil: 'domcontentloaded' | 'load' | 'networkidle';
    output: string;
    followExternal: boolean;
    headless: boolean;
    proxy?: string;
    userAgent?: string;
    verbose?: boolean;
}

export function isExternalUrl(baseUrl: string, urlToCheck: string) {
    const baseHostname = new URL(baseUrl).hostname;
    const urlHostname = new URL(urlToCheck).hostname;
    return baseHostname !== urlHostname;
}

export async function runCrawler(options: CrawlerOptions) {
    if (options.verbose) {
        log.setLevel(log.LEVELS.DEBUG);
    }

    const crawlerConfig = {
        headless: options.headless,
        maxConcurrency: options.concurrency, // TODO implement
        navigationTimeoutSecs: options.timeout,
        requestHandlerTimeoutSecs: options.timeout * 2,

        ...(options.proxy && {
            proxyUrl: options.proxy
        }),

        browserPoolOptions: {
            useFingerprints: true,
            ...(options.userAgent && {
                defaultUserAgent: options.userAgent
            })
        },

        async requestHandler({ request, page, enqueueLinks, log }: { request: Request, page: Page, enqueueLinks: (options?: EnqueueLinksOptions) => Promise<unknown>, log: Log }) {
            const { url, userData: { depth = 0 } } = request;
            log.info(`Crawling ${url} (depth: ${depth})`);

            try {
                await page.waitForLoadState(options.waitUntil);

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

                await Dataset.pushData({
                    url,
                    title,
                    depth,
                    metadata,
                    timestamp: new Date().toISOString()
                });

                if (depth >= options.maxDepth) {
                    log.debug(`Reached max depth at ${url}`);
                    return;
                }

                await enqueueLinks({
                    strategy: 'same-domain',
                    transformRequestFunction: (req) => {
                        if (!options.followExternal && isExternalUrl(options.startUrl, req.url)) {
                            return false;
                        }
                        (req as any).userData = { depth: depth + 1 };
                        return req;
                    }
                });

            } catch (error: any) {
                log.error(`Failed to crawl ${url}: ${error.message}`);
            }
        },

        failedRequestHandler({ request, log }: { request: Request, log: Log }) {
            log.error(`Request ${request.url} failed`);
        },

        maxRequestsPerCrawl: options.maxPages,
    };

    const crawler = new PlaywrightCrawler(crawlerConfig);
    await crawler.run([options.startUrl]);
    
    return {
        success: true,
        outputPath: options.output
    };
}

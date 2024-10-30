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

export class Crawler {
    private options: CrawlerOptions;
    private crawler: PlaywrightCrawler;

    constructor(options: CrawlerOptions) {
        this.options = options;
        if (options.verbose) {
            log.setLevel(log.LEVELS.DEBUG);
        }
        
        this.crawler = new PlaywrightCrawler(this.getCrawlerConfig());
    }

    private isExternalUrl(urlToCheck: string): boolean {
        const baseHostname = new URL(this.options.startUrl).hostname;
        const urlHostname = new URL(urlToCheck).hostname;
        return baseHostname !== urlHostname;
    }

    private getCrawlerConfig() {
        return {
            headless: this.options.headless,
            maxConcurrency: this.options.concurrency,
            navigationTimeoutSecs: this.options.timeout,
            requestHandlerTimeoutSecs: this.options.timeout * 2,
            
            ...(this.options.proxy && {
                proxyUrl: this.options.proxy
            }),

            browserPoolOptions: {
                useFingerprints: true,
                ...(this.options.userAgent && {
                    defaultUserAgent: this.options.userAgent
                })
            },

            requestHandler: this.handleRequest.bind(this),
            failedRequestHandler: this.handleFailedRequest.bind(this),
            maxRequestsPerCrawl: this.options.maxPages,
        };
    }

    private async handleRequest({ request, page, enqueueLinks, log }: { 
        request: Request, 
        page: Page, 
        enqueueLinks: (options?: EnqueueLinksOptions) => Promise<unknown>, 
        log: Log 
    }) {
        const { url, userData: { depth = 0 } } = request;
        log.info(`Crawling ${url} (depth: ${depth})`);

        try {
            await page.waitForLoadState(this.options.waitUntil);

            const title = await page.title();
            const metadata = await this.extractMetadata(page);

            await Dataset.pushData({
                url,
                title,
                depth,
                metadata,
                timestamp: new Date().toISOString()
            });

            if (depth >= this.options.maxDepth) {
                log.debug(`Reached max depth at ${url}`);
                return;
            }

            await this.enqueueNextLinks(enqueueLinks, depth);

        } catch (error: any) {
            log.error(`Failed to crawl ${url}: ${error.message}`);
        }
    }

    private async extractMetadata(page: Page) {
        return page.evaluate(() => {
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
    }

    private async enqueueNextLinks(enqueueLinks: (options?: EnqueueLinksOptions) => Promise<unknown>, currentDepth: number) {
        await enqueueLinks({
            strategy: 'same-domain',
            transformRequestFunction: (req) => {
                if (!this.options.followExternal && this.isExternalUrl(req.url)) {
                    return false;
                }
                (req as any).userData = { depth: currentDepth + 1 };
                return req;
            }
        });
    }

    private handleFailedRequest({ request, log }: { request: Request, log: Log }) {
        log.error(`Request ${request.url} failed`);
    }

    public async run() {
        await this.crawler.run([this.options.startUrl]);
        
        return {
            success: true,
            outputPath: this.options.output
        };
    }
}

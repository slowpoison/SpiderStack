import { Configuration, Dataset, EnqueueLinksOptions, log, Log, PlaywrightCrawler, PlaywrightCrawlerOptions, Request } from 'crawlee';
import os from 'os';
import { Page } from 'playwright';

export interface CrawlerOptions {
    maxDepth: number;
    maxPages: number;
    maxConcurrency: number;
    timeoutSecs: number;
    waitUntil: 'domcontentloaded' | 'load' | 'networkidle';
    outDir: string;
    headless: boolean;
    userAgent?: string;
    verbose?: boolean;
}

export class Crawler {
    static defaultOptions: CrawlerOptions = {
        maxDepth: 2,
        maxPages: 10,
        maxConcurrency: os.cpus().length,
        timeoutSecs: 30,
        waitUntil: 'domcontentloaded',
        outDir: './storage',
        headless: true
    }

    private crawledUrls: Set<string> = new Set();
    private url: string;
    private options: CrawlerOptions;
    private crawler: PlaywrightCrawler;

    constructor(url: string, options?: Partial<CrawlerOptions>) {
        this.options = {
            ...Crawler.defaultOptions,
            ...options
        };

        if (this.options.verbose) {
            log.setLevel(log.LEVELS.DEBUG);
        }
        
        this.crawler = new PlaywrightCrawler(this.playwrightOptions(), this.playwrightConfig());
        this.url = url;
    }

    public getCrawledUrls() {
        return this.crawledUrls;
    }

    private isExternalUrl(urlToCheck: string): boolean {
        const baseHostname = new URL(this.url).hostname;
        const urlHostname = new URL(urlToCheck).hostname;
        return baseHostname !== urlHostname;
    }

    private playwrightOptions(): PlaywrightCrawlerOptions {
        return {
            headless: this.options.headless,
            maxConcurrency: this.options.maxConcurrency,
            navigationTimeoutSecs: this.options.timeoutSecs,
            requestHandlerTimeoutSecs: this.options.timeoutSecs! * 2,
            
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

    private playwrightConfig(): Configuration {
        return new Configuration({
                purgeOnStart: false,
                persistStorage: true,
            });
    }

    private async handleRequest({ request, page, enqueueLinks, log }: { 
        request: Request, 
        page: Page, 
        enqueueLinks: (options?: EnqueueLinksOptions) => Promise<unknown>, 
        log: Log 
    }) {
        const { url, userData: { depth = 0 } } = request;
        log.info(`Crawling ${url} (depth: ${depth})`);
        this.crawledUrls.add(url);

        try {
            await page.waitForLoadState(this.options.waitUntil);

            const title = await page.title();
            log.debug(`Title: ${title}`);
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
                console.log('transformRequestFunction', req.url);
                (req as any).userData = { depth: currentDepth + 1 };
                return req;
            }
        });
    }

    private handleFailedRequest({ request, log }: { request: Request, log: Log }) {
        log.error(`Request ${request.url} failed`);
    }

    public async run() {
        await this.crawler.run([this.url]);
        
        return {
            success: true,
            outputPath: this.options.outDir
        };
    }
}

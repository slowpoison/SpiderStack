import { Configuration, Dataset, PlaywrightCrawler, PlaywrightRequestHandler } from 'crawlee';
import { Response } from 'got';
import { Page } from 'playwright';

export interface CrawlerOptions {
  maxRequestsPerCrawl: number
  printOnly: boolean
}

export default class Crawler {
  static CRAWLER_ID = 'crawl'

  crawler: PlaywrightCrawler
  dataset?: Dataset
  globs: string[] = []
  options: CrawlerOptions = { // default options
    maxRequestsPerCrawl: 100,
    printOnly: false
  }
  config:Configuration

  constructor()
  constructor(options: Partial<CrawlerOptions>)
  constructor(options?: Partial<CrawlerOptions>) {
    if (typeof options === 'object') {
      Object.assign(this.options, options)
    }

    this.config = new Configuration({
        purgeOnStart: true,
        defaultDatasetId: Crawler.CRAWLER_ID,
        defaultKeyValueStoreId: Crawler.CRAWLER_ID,
        defaultRequestQueueId: Crawler.CRAWLER_ID,
      })

    this.crawler = new PlaywrightCrawler({
        requestHandler: this.requestHandler,
        maxConcurrency: 5,
        maxRequestsPerCrawl: this.options.maxRequestsPerCrawl,
        // maxRequestsPerMinute: 6,
        //headless: false,
      }, this.config)
  }

  requestHandler: PlaywrightRequestHandler =
    async ({ $, page, request, sendRequest, enqueueLinks }) => {
        let title = await page.title()

        await enqueueLinks({
          selector: 'a',
          globs: this.globs,
        });

        let resp = await sendRequest()
        if (this.options.printOnly) {
          console.log('title', title)
          console.log('url', resp.url)
          console.log('etag', resp.headers.etag)
        } else {
          await this.storeData(page, resp)
        }
    }

  async storeData(page: Page, resp: Response<string>) {
    /*
    let allowedPrefixes = Url2AllowedPrefixes[this.options.url]
    if (!allowedPrefixes?.some(prefix => resp.url.startsWith(prefix))) {
      console.log('skipping', resp.url)
      return
    }
      */

    let title = page.title();
    await this.dataset?.pushData({
      title,
      url: resp.url,
      html: resp.body
    });
}

  async run(urls: string[]): Promise<void>
  async run(url: string): Promise<void>
  async run(urlOrUrls: string | string[]): Promise<void> {
    let urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls]
    // lazy load dataset because of await
    if (!this.dataset) {
      this.dataset = await Dataset.open(Crawler.CRAWLER_ID, {config: this.config})
    }
    await this.crawler.run(urls)
  }
}

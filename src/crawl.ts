import { program } from 'commander';
import { Crawler, CrawlerOptions } from './crawler.js';

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
    .option('--headless', 'Run browser in headless mode', true)
    .option('-v, --verbose', 'Enable verbose logging')
    .parse();

const cliOptions = program.opts();
const startUrl = program.args[0];

// Create crawler options from CLI arguments
const crawlerOptions: CrawlerOptions = {
    maxDepth: parseInt(cliOptions.maxDepth),
    maxPages: parseInt(cliOptions.maxPages),
    maxConcurrency: parseInt(cliOptions.concurrency),
    timeoutSecs: parseInt(cliOptions.timeout),
    waitUntil: cliOptions.waitUntil as 'domcontentloaded' | 'load' | 'networkidle',
    outDir: cliOptions.output,
    headless: cliOptions.headless,
    userAgent: cliOptions.userAgent,
    verbose: cliOptions.verbose
};

// Print start message
console.log(`Starting crawler with following configuration:
- Start URL: ${startUrl}
- Max depth: ${crawlerOptions.maxDepth}
- Max pages: ${crawlerOptions.maxPages}
- Concurrency: ${crawlerOptions.maxConcurrency}
- Output: ${crawlerOptions.outDir}
`);

// Run the crawler
try {
    const crawler = new Crawler(startUrl, crawlerOptions);
    const result = await crawler.run();
    
    console.log('Crawling finished successfully!');
    console.log(`Results saved to: ${result.outputPath}`);
} catch (error) {
    console.error('Crawler failed:', error);
    process.exit(1);
}

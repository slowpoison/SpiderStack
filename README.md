# README.md for SpiderStack Project

## Introduction
SpiderStack is a simple command line crawler based on the powerful [Crawlee]("https://crawlee.dev/") library.

## Project Description
The philosophy behind SpiderStack is to provide a simple and intuitive crawler that can be easily integrated into your workflow.

## Installation
To install SpiderStack locally on your system (Linux/MacOS), clone the repository and run the following commands:

1. Clone repository:
   ```
   git clone https://github.com/slowpoison/SpiderStack.git
   ```
2. Navigate to project directory:
   ```
   cd SpiderStack
   ```
3. Install dependencies and build the package (if using a Python virtual environment):
   ```
   pnpm run crawl <url>
   ```

## Usage Guide
SpiderStack provides a flexible command-line interface with various configuration options:

USAGE
pnpm run crawl <startUrl> [options]

ARGUMENTS
  startUrl    Starting URL to crawl

OPTIONS
  -d, --max-depth <number>      Maximum crawl depth (default: 3)
  -p, --max-pages <number>      Maximum number of pages to crawl (default: 100)
  -c, --concurrency <number>    Number of concurrent requests (default: 10)
  -t, --timeout <number>        Navigation timeout in seconds (default: 30)
  -w, --wait-until <event>      When to consider navigation finished: domcontentloaded, load, networkidle (default: domcontentloaded)
  -o, --output <path>          Output dataset name (default: crawler-results)
  --follow-external            Follow links to external domains (default: false)
  --headless                   Run browser in headless mode (default: true)
  --proxy <url>               Proxy URL to use
  --user-agent <string>       Custom user agent string
  -v, --verbose               Enable verbose logging
  -h, --help                  Display help for command

EXAMPLES
  # Basic crawl starting from example.com
  crawl https://example.com

  # Crawl with custom depth and page limit
  crawl https://example.com -d 5 -p 200

  # Crawl with increased concurrency and timeout
  crawl https://example.com -c 20 -t 60

  # Crawl with custom output directory
  crawl https://example.com -o my-crawl-results


## Contributing Guidelines
1. Fork the project repository on GitHub.
2. Write tests where applicable and ensure your changes don't break existing functionality (see [testing guide](#Testing-Guidelines)).
3. Create a comprehensive commit message that includes what you did, why it was necessary, and how to revert if needed.
4. Submit a pull request for review by opening an issue on GitHub or directly submitting the pull request in our repository.

## Testing Guidelines
Run tests using the following command:
```
pnpm run test
```

## License
SpiderStack is open-sourced under the MIT License. The complete license text can be found in the LICENSE file at the root of this project.

## Acknowledgments & Credits
SpiderStack is built upon Crawlee using TypeScript.

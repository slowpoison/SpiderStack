import esMain from 'es-main';
import Crawler from './crawler.js'

if (esMain(import.meta)) {
  if (process.argv[2]) {
    var jobCrawler = new Crawler({
        maxRequestsPerCrawl: 10,
        printOnly: true
    })
    jobCrawler.run(process.argv[2])
  } else {
    throw new Error('No url specified')
  }
}

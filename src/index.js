import { fetchRSSFeed } from './rss-fetcher.js';
import { deduplicateNews } from './deduplicator.js';
import { rewriteWithAI } from './ai-rewriter.js';
import { sendToTelegram } from './telegram-sender.js';

async function main() {
  try {
    console.log('Starting RSS Bot...');
    
    const feedUrl = 'https://lenta.ru/rss';
    let news = await fetchRSSFeed(feedUrl);
    
    console.log(`Fetched ${news.length} news items`);
    
    news = await deduplicateNews(news);
    console.log(`After deduplication: ${news.length} items`);
    
    for (const item of news) {
      try {
        const aiText = await rewriteWithAI(item.description);
        
        const post = {
          title: item.title,
          text: aiText,
          image: item.image,
          link: item.link
        };
        
        await sendToTelegram(post);
        console.log(`Sent: ${item.title}`);
        
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        console.error(`Error processing item: ${error.message}`);
      }
    }
    
    console.log('RSS Bot finished');
  } catch (error) {
    console.error(`Main error: ${error.message}`);
    process.exit(1);
  }
}

main();

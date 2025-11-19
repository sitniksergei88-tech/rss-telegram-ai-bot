const { fetchRSSFeed } = require('./rss-fetcher');
const { deduplicateNews } = require('./deduplicator');
const { rewriteWithAI } = require('./ai-rewriter');
const { sendToTelegram } = require('./telegram-sender');

async function main() {
  try {
    console.log('Starting RSS Bot...');
    
    // Получаем новости только за последний час
    const feedUrl = 'https://lenta.ru/rss';
    let news = await fetchRSSFeed(feedUrl);
    
    console.log(`Fetched ${news.length} news items`);
    
    // Дедубликация
    news = await deduplicateNews(news);
    console.log(`After deduplication: ${news.length} items`);
    
    // Отправляем посты в Telegram
    for (const item of news) {
      try {
        // AI переписывает текст
        const aiText = await rewriteWithAI(item.description);
        
        // Формируем пост с медиа
        const post = {
          title: item.title,
          text: aiText,
          image: item.image,
          link: item.link
        };
        
        await sendToTelegram(post);
        console.log(`Sent: ${item.title}`);
        
        // Пауза между постами (1 сек)
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

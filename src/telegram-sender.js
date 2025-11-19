const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const https = require('https');
const path = require('path');

async function downloadImage(imageUrl, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(imageUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // удаляем файл при ошибке
      reject(err);
    });
  });
}

async function sendToTelegram(post) {
  const token = process.env.TELEGRAM_TOKEN;
  const channelId = process.env.CHANNEL_ID;
  
  if (!token || !channelId) {
    console.error('Missing TELEGRAM_TOKEN or CHANNEL_ID');
    return;
  }
  
  try {
    let messageText = `<b>${post.title}</b>\n\n${post.text}`;
    
    // Если есть изображение - отправляем с фото
    if (post.image) {
      try {
        const tempImagePath = path.join('/tmp', `img_${Date.now()}.jpg`);
        await downloadImage(post.image, tempImagePath);
        
        const form = new FormData();
        form.append('chat_id', channelId);
        form.append('photo', fs.createReadStream(tempImagePath));
        form.append('caption', messageText);
        form.append('parse_mode', 'HTML');
        
        const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          body: form
        });
        
        fs.unlink(tempImagePath, () => {}); // удаляем временный файл
        
        if (!response.ok) {
          console.error(`Telegram error: ${response.statusText}`);
        }
      } catch (imgError) {
        // Если ошибка с изображением - отправляем просто текст
        console.warn(`Image error: ${imgError.message}, sending text only`);
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channelId,
            text: messageText,
            parse_mode: 'HTML'
          })
        });
      }
    } else {
      // Отправляем просто текст
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          text: messageText,
          parse_mode: 'HTML'
        })
      });
    }
  } catch (error) {
    console.error(`Error sending to Telegram: ${error.message}`);
  }
}

module.exports = { sendToTelegram };

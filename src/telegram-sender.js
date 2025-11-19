export async function sendToTelegram(items) {
  const token = process.env.TELEGRAM_TOKEN;
  const channelId = process.env.CHANNEL_ID;

  if (!token || !channelId) {
    console.error('[Telegram]  Missing TELEGRAM_TOKEN or CHANNEL_ID');
    return [];
  }

  function escapeHTML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMessage(item) {
    const text = `<b>${escapeHTML(item.title)}</b>\n\n${escapeHTML(item.rewritten)}\n\n<a href="${item.link}">Читать полностью</a>`;
    return text;
  }

  const results = [];
  const failed = [];

  for (const item of items) {
    try {
      const message = formatMessage(item);

      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channelId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false
          }),
          timeout: 15000
        }
      );

      if (response.ok) {
        results.push({ link: item.link, status: 'sent' });
        console.log(`[Telegram]  Sent: ${item.title.substring(0, 50)}`);
      } else {
        const error = await response.json();
        failed.push({ ...item, reason: error.description });
        console.error(`[Telegram]  Failed: ${error.description}`);
      }
    } catch (error) {
      failed.push({ ...item, reason: error.message });
      console.error(`[Telegram]  Error:`, error.message);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  if (failed.length > 0) {
    console.log(`[Telegram]  ${failed.length} items failed`);
  }

  return results;
}

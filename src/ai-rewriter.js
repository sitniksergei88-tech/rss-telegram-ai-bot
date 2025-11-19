export async function rewriteWithAI(text) {
  const token = process.env.HUGGING_FACE_TOKEN;

  if (!token || text.length < 50) {
    return truncateText(text, 200);
  }

  try {
    const prompt = `Переписать кратко в 1-2 предложения, сохраняя основные факты:

${text}`;

    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 200,
            temperature: 0.7,
            top_p: 0.9
          }
        }),
        timeout: 30000
      }
    );

    if (!response.ok) {
      console.warn(`[AI Rewriter] API Error ${response.status}`);
      return truncateText(text, 200);
    }

    const result = await response.json();
    
    if (Array.isArray(result) && result[0]?.generated_text) {
      let rewritten = result[0].generated_text.replace(prompt, '').trim();
      if (rewritten.length > 20) {
        return rewritten;
      }
    }

    return truncateText(text, 200);
    
  } catch (error) {
    console.error('[AI Rewriter] Error:', error.message);
    return truncateText(text, 200);
  }
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

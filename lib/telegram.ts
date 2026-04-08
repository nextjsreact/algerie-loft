/**
 * Send a message to a Telegram chat via Bot API.
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars.
 * Non-blocking — never throws, just logs on failure.
 */
export async function sendTelegramNotification(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    // Not configured — skip silently
    return
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[Telegram] Failed to send message:', err)
    }
  } catch (err) {
    console.error('[Telegram] Network error:', err)
  }
}

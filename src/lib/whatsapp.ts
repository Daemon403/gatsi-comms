const GREEN_API_URL = process.env.GREEN_API_URL || 'https://api.greenapi.com';
const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || '';
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || '';

function formatWhatsAppChatId(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.endsWith('@c.us') || cleaned.endsWith('@g.us')) return cleaned;
  if (cleaned.startsWith('263')) return `${cleaned}@c.us`;
  if (cleaned.startsWith('+263')) return `${cleaned.slice(1)}@c.us`;
  return `${cleaned}@c.us`;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN || GREEN_API_INSTANCE_ID === 'your-instance-id') {
    console.log('[WHATSAPP] Green API not configured, skipping send');
    return false;
  }

  try {
    const chatId = formatWhatsAppChatId(phone);
    const url = `${GREEN_API_URL}/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[WHATSAPP] Green API error (${response.status}):`, body);
      return false;
    }

    const data = await response.json();
    console.log(`[WHATSAPP] Message sent, id: ${data.idMessage}`);
    return true;
  } catch (error) {
    console.error('[WHATSAPP] Failed to send via Green API:', error);
    return false;
  }
}

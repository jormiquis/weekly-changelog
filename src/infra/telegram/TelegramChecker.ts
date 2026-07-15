import type { Checker } from '../../domain/Checker.js';

 export class TelegramCheker implements Checker {
  constructor(
    private readonly botToken: string,
    private readonly chatId: string
  ) {}

  async sendForApproval(imagePath: string, caption: string): Promise<boolean> {
    const form = new FormData()
    const fs = await import('fs')
    const imageBuffer = fs.readFileSync(imagePath)
    form.append('chat_id', this.chatId)
    form.append('photo', new Blob([imageBuffer]), 'card.png')
    form.append('caption', caption + '\n\nResponde ✅ para publicar o ❌ para rechazar')

    await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
      method: 'POST',
      body: form
    })

    return this.waitForResponse()
  }

  private async waitForResponse(): Promise<boolean> {
    const timeout = 30 * 60 * 1000;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=-1`
      );
      const data = await response.json()

      const lastMessage = data.result?.[0]?.message
      if (lastMessage?.chat?.id === Number(this.chatId)) {
        const text = lastMessage.text?.trim()
        if (text === 'yes') return true;
        if (text === 'no') return false;
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    console.log('Timeout: no se recibió respuesta')
    return false
  }
}
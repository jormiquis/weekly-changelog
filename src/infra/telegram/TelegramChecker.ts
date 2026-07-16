import type { Checker } from '../../domain/Checker.js';

const APPROVE = new Set(['yes', 'y', 'ok', '👍']);
const REJECT = new Set(['no', 'nope', 'n', '👎']);

 export class TelegramCheker implements Checker {
  constructor(
    private readonly botToken: string,
    private readonly chatId: string
  ) {}

  async sendForApproval(imagePath: string, caption: string): Promise<boolean> {
    const form = new FormData();
    const fs = await import('fs');
    const imageBuffer = fs.readFileSync(imagePath);

    form.append('chat_id', this.chatId);
    form.append('photo', new Blob([imageBuffer]), 'card.png');
    form.append('caption', caption + '\n\nAnswer YES to publish or NO to reject');

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
        const text = lastMessage.text?.trim().toLowerCase()

        if (text && APPROVE.has(text)) return true;
        if (text && REJECT.has(text)) return false;
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    console.log('TimeOut: no response');

    return false
  }
}
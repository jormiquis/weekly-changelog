import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import type { Checker } from '../../../src/domain/Checker.js';
import { TelegramCheker } from '../../../src/infra/telegram/TelegramChecker.js';

describe('TelegramCheker', () => {
  const imagePath = '/tmp/telegram-checker-test-card.png';
  const dashboardUrl = 'https://jormiquis.github.io/weekly-changelog/';
  const caption = `Weekly Changelog - Week of Jul 15\n\n${dashboardUrl}\n\n¿Publicar?`;

  beforeEach(() => {
    writeFileSync(imagePath, Buffer.from('fake-png-bytes'));
  });

  afterEach(() => {
    unlinkSync(imagePath);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function stubTelegramFetch(getUpdatesResponses: unknown[]) {
    let call = 0;
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('sendPhoto')) return { ok: true };

      const body = getUpdatesResponses[Math.min(call, getUpdatesResponses.length - 1)];
      call++;
      return { ok: true, json: async () => body };
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('sends the card with the dashboard link and asks for a yes/no reply', async () => {
    const fetchMock = stubTelegramFetch([{ result: [{ message: { chat: { id: 123 }, text: 'yes' } }] }]);

    const checker: Checker = new TelegramCheker('bot-token', '123');
    await checker.sendForApproval(imagePath, caption);

    const [sendUrl, sendOptions] = fetchMock.mock.calls[0]!;
    expect(sendUrl).toBe('https://api.telegram.org/botbot-token/sendPhoto');
    expect(sendOptions.method).toBe('POST');

    const form = sendOptions.body as FormData;
    expect(form.get('chat_id')).toBe('123');
    expect(form.get('photo')).toBeInstanceOf(Blob);
    expect(form.get('caption')).toContain(dashboardUrl);
  });

  it('resolves true when the chat replies "yes"', async () => {
    stubTelegramFetch([{ result: [{ message: { chat: { id: 123 }, text: 'yes' } }] }]);
    const checker = new TelegramCheker('bot-token', '123');

    await expect(checker.sendForApproval(imagePath, caption)).resolves.toBe(true);
  });

  it('resolves false when the chat replies "no"', async () => {
    stubTelegramFetch([{ result: [{ message: { chat: { id: 123 }, text: 'no' } }] }]);
    const checker = new TelegramCheker('bot-token', '123');

    await expect(checker.sendForApproval(imagePath, caption)).resolves.toBe(false);
  });

  it('ignores replies from a different chat and keeps polling', async () => {
    const fetchMock = stubTelegramFetch([
      { result: [{ message: { chat: { id: 999 }, text: 'yes' } }] },
      { result: [{ message: { chat: { id: 123 }, text: 'yes' } }] }
    ]);
    vi.useFakeTimers();

    const checker = new TelegramCheker('bot-token', '123');
    const resultPromise = checker.sendForApproval(imagePath, caption);

    await vi.advanceTimersByTimeAsync(5000);

    await expect(resultPromise).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('resolves false after 30 minutes with no matching response', async () => {
    stubTelegramFetch([{ result: [] }]);
    vi.useFakeTimers();

    const checker = new TelegramCheker('bot-token', '123');
    const resultPromise = checker.sendForApproval(imagePath, caption);

    await vi.advanceTimersByTimeAsync(30 * 60 * 1000 + 1000);

    await expect(resultPromise).resolves.toBe(false);
  }, 15000);
});

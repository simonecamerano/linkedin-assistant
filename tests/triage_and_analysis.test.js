import { describe, test, expect, vi, afterEach } from 'vitest';
import { eseguiTriagePost } from '../src/triage_filter.js';
import { analizzaPostPerSSI } from '../src/ssi_analyzer.js';

vi.mock('../src/config.js', () => ({
  GROQ_API_KEY: 'test-groq-key',
  DEEPSEEK_API_KEY: 'test-deepseek-key',
  TRIAGE_MODEL: 'llama-3.3-70b-versatile',
  ANALYSIS_MODEL: 'deepseek-chat',
}));

const fetchSpy = vi.spyOn(global, 'fetch');

describe('triage_filter tests', () => {
  afterEach(() => {
    fetchSpy.mockClear();
  });

  test('eseguiTriagePost returns true if Groq responds with SI', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'SI' } }]
      })
    });

    const result = await eseguiTriagePost({ title: 'T', url: 'U', content: 'C' });
    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test('eseguiTriagePost returns false if Groq responds with NO', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'NO' } }]
      })
    });

    const result = await eseguiTriagePost({ title: 'T', url: 'U', content: 'C' });
    expect(result).toBe(false);
  });

  test('eseguiTriagePost returns false on API error', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const result = await eseguiTriagePost({ title: 'T', url: 'U', content: 'C' });
    expect(result).toBe(false);
  });

  test('eseguiTriagePost returns false on fetch throw', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    const result = await eseguiTriagePost({ title: 'T', url: 'U', content: 'C' });
    expect(result).toBe(false);
  });
});

describe('ssi_analyzer tests', () => {
  afterEach(() => {
    fetchSpy.mockClear();
  });

  test('analizzaPostPerSSI returns report on success', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Report content' } }]
      })
    });

    const result = await analizzaPostPerSSI({ title: 'T', url: 'U', content: 'C' }, 'Profile');
    expect(result).toBe('Report content');
  });

  test('analizzaPostPerSSI returns error message on API failure', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'Error body'
    });

    const result = await analizzaPostPerSSI({ title: 'T', url: 'U', content: 'C' }, 'Profile');
    expect(result).toContain('Error: DeepSeek API returned 400');
  });

  test('analizzaPostPerSSI returns error message on fetch throw', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network timeout'));

    const result = await analizzaPostPerSSI({ title: 'T', url: 'U', content: 'C' }, 'Profile');
    expect(result).toContain('Error: Network timeout');
  });
});

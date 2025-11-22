export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

function calculateDelay(
  attempt: number,
  config: Required<RetryConfig>,
  retryAfter?: number
): number {
  if (retryAfter) {
    return Math.min(retryAfter * 1000, config.maxDelayMs);
  }

  const exponentialDelay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);

  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  const delayWithJitter = exponentialDelay + jitter;

  return Math.min(delayWithJitter, config.maxDelayMs);
}

function getRetryAfter(response: Response): number | undefined {
  const retryAfter = response.headers.get('Retry-After');
  if (!retryAfter) return undefined;

  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds;
  }

  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000));
  }

  return undefined;
}

function isRetryable(
  error: any,
  response: Response | undefined,
  config: Required<RetryConfig>
): boolean {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  if (response && config.retryableStatuses.includes(response.status)) {
    return true;
  }

  if (response && config.retryableStatuses.includes(response.status)) {
    return true;
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<Response>,
  config: RetryConfig = {}
): Promise<Response> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      const response = await fn();

      if (response.ok) {
        return response;
      }

      lastResponse = response;

      if (response.status === 429) {
        const retryAfter = getRetryAfter(response);
        lastError = new RateLimitError(
          `Rate limit exceeded (429). ${
            retryAfter
              ? `Retry after ${retryAfter} seconds`
              : 'No retry-after header'
          }`,
          retryAfter,
          response
        );

        if (attempt === fullConfig.maxRetries) {
          throw lastError;
        }

        const delay = calculateDelay(attempt, fullConfig, retryAfter);
        console.warn(
          `Rate limited. Retrying after ${Math.round(delay)}ms (attempt ${
            attempt + 1
          }/${fullConfig.maxRetries})`
        );
        await sleep(delay);
        continue;
      }

      if (isRetryable(lastError, response, fullConfig)) {
        lastError = new Error(
          `Request failed with status ${response.status}: ${response.statusText}`
        );

        if (attempt === fullConfig.maxRetries) {
          throw lastError;
        }

        const delay = calculateDelay(attempt, fullConfig);
        console.warn(
          `Request failed (${response.status}). Retrying after ${Math.round(
            delay
          )}ms (attempt ${attempt + 1}/${fullConfig.maxRetries})`
        );
        await sleep(delay);
        continue;
      }

      throw new Error(
        `Request failed with status ${response.status}: ${response.statusText}`
      );
    } catch (error: any) {
      lastError = error;

      if (attempt === fullConfig.maxRetries) {
        throw new RetryError(
          `Request failed after ${fullConfig.maxRetries} retries: ${lastError.message}`,
          attempt + 1,
          lastError
        );
      }

      if (isRetryable(error, lastResponse, fullConfig)) {
        const delay = calculateDelay(attempt, fullConfig);
        console.warn(
          `Request failed (${error.message}). Retrying after ${Math.round(
            delay
          )}ms (attempt ${attempt + 1}/${fullConfig.maxRetries})`
        );
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw new RetryError(
    `Request failed after ${fullConfig.maxRetries} retries`,
    fullConfig.maxRetries + 1,
    lastError!
  );
}


// Centralized configuration so the AI agent can point at any OpenAI-compatible
// API (Azure OpenAI, OpenRouter, Groq, vLLM, Ollama, etc.) instead of only api.openai.com.
// Set OPENAI_BASE_URL / OPENAI_MODEL / OPENAI_IMAGE_MODEL to override the defaults below.
export const getOpenAIApiKey = (): string =>
  process.env.OPENAI_API_KEY || 'sk-proj-';

export const getOpenAIBaseUrl = (): string | undefined =>
  process.env.OPENAI_BASE_URL || undefined;

export const getOpenAIModel = (fallback: string): string =>
  process.env.OPENAI_MODEL || fallback;

export const getOpenAIImageModel = (): string =>
  process.env.OPENAI_IMAGE_MODEL || 'chatgpt-image-latest';

export const openAIClientOptions = () => ({
  apiKey: getOpenAIApiKey(),
  baseURL: getOpenAIBaseUrl(),
});

// Gemini API Configuration
export const GEMINI_CONFIG = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  defaultModel: "gemini-3.5-flash-lite",
  fallbackModels: ["gemini-3.7-flash", "gemini-3.6-flash"],
};

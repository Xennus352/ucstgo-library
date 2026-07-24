import Groq from "groq-sdk";

// Helper function to get the Groq instance on demand at runtime
export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is missing.");
  }

  return new Groq({ apiKey });
}

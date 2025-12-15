/**
 * Service to communicate with the Python RAG Backend.
 */

const BACKEND_URL = 'http://localhost:8000/chat';

export const generateRagResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Backend supports both "query" and "message" now.
      body: JSON.stringify({ query: prompt }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.answer || 'No answer received.';
  } catch (error) {
    console.error('RAG API Error:', error);
    throw new Error(
      "Failed to connect to RAG Backend. Please ensure 'server.py' is running on port 8000."
    );
  }
};


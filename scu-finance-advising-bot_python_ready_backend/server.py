# server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
from dotenv import load_dotenv

from rag_pipeline import build_rag_prompt  # <-- 新增：导入 RAG

# Load .env
load_dotenv()

# Read OpenRouter API key from environment
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
print("OPENROUTER_API_KEY:", OPENROUTER_API_KEY)  # debug 用，OK 后可以删掉

if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY is not set. Check your .env or system env.")

# Init OpenAI client, pointing to OpenRouter
client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)

app = FastAPI()

# Allow frontend (Vite dev server) to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Request / Response models ----------

class ChatRequest(BaseModel):
    # Support both { "query": "..." } and { "message": "..." }
    query: str | None = None
    message: str | None = None


class ChatResponse(BaseModel):
    answer: str


# ---------- DeepSeek + RAG ----------

def run_rag(question: str) -> str:
    """
    Use our local RAG pipeline to build a context-rich prompt,
    then send it to deepseek-chat via OpenRouter.
    """
    try:
        # 1) First retrieve information from the vector database, then construct a context-augmented prompt
        rag_prompt, used_chunks = build_rag_prompt(question)

        # Print out the retrieved chunks for debugging.
        print("\n[RAG] CHUNKS USED:")
        for h in used_chunks:
            print(h["source"], "|", h["chunk_id"], "|", f"{h['score']:.3f}")

        # 2) Send the constructed prompt to the DeepSeek-Chat API.
        response = client.chat.completions.create(
            model="deepseek/deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are the SCU Finance Advising Assistant. "
                        "Always be accurate and concise. "
                        "If something is not clear from the provided references, "
                        "say you are not sure and suggest checking the SCU bulletin "
                        "or contacting an academic advisor."
                    ),
                },
                {
                    "role": "user",
                    "content": rag_prompt,
                },
            ],
            temperature=0.3,
        )

        return response.choices[0].message.content

    except Exception as e:
        # Return visible error text so you can debug in the chat
        print("[RAG ERROR]", e)
        return f"[Backend Error] {e}"


# ---------- /chat API ----------

@app.post("/chat", response_model=ChatResponse)
async def chat_api(req: ChatRequest):
    # Prefer query, fall back to message
    question = req.query or req.message
    if not question:
        raise HTTPException(
            status_code=400,
            detail="No question received. Expected field 'query' or 'message'.",
        )

    answer = run_rag(question)
    return ChatResponse(answer=answer)


# ---------- Run with Uvicorn ----------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

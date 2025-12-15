# rag_pipeline.py
"""
Simple RAG pipeline for SCU Finance Advising Bot.

- Load local data files from ./data
- Convert Excel & PDF to plain text
- Chunk texts
- Build embeddings with SentenceTransformer (all-MiniLM-L6-v2)
- Build FAISS index
- For a query: retrieve top-k chunks & build RAG prompt
"""

import os
from typing import List, Dict, Tuple

import numpy as np
import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
    # pip install PyPDF2 if you want PDF support


# --------- Paths & basic config ---------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

CHUNK_SIZE = 500        # roughly tokens/words, simple split by words here
CHUNK_OVERLAP = 50
TOP_K = 5               # how many chunks for each query


# --------- Helpers to load & clean docs ---------

def df_to_text(df: pd.DataFrame, name: str) -> str:
    """Mimic your notebook's df_to_text: row-wise 'col: value' text."""
    df_clean = df.dropna(how="all", axis=0).dropna(how="all", axis=1)
    df_clean = df_clean.replace({np.nan: ""})

    lines: List[str] = []
    lines.append(f"TABLE SOURCE: {name}")

    for _, row in df_clean.iterrows():
        parts = []
        for col, val in row.items():
            val = str(val).strip()
            if val != "":
                col_name = str(col).strip()
                parts.append(f"{col_name}: {val}")
        if parts:
            lines.append(" | ".join(parts))

    return "\n".join(lines)


def extract_pdf_text(path: str) -> str:
    """Very simple PDF text extractor."""
    if PyPDF2 is None:
        raise RuntimeError(
            "PyPDF2 is not installed. Run `pip install PyPDF2` to enable PDF support."
        )
    text_parts: List[str] = []
    with open(path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text = page.extract_text() or ""
            text_parts.append(text)
    return "\n".join(text_parts)


def load_all_docs() -> List[Dict]:
    """
    Load all Excel & PDF files under ./data into a list of
    {'source': filename, 'text': text}.
    """
    docs: List[Dict] = []

    if not os.path.isdir(DATA_DIR):
        raise RuntimeError(f"DATA_DIR does not exist: {DATA_DIR}")

    for fname in os.listdir(DATA_DIR):
        path = os.path.join(DATA_DIR, fname)
        if not os.path.isfile(path):
            continue

        lower = fname.lower()

        try:
            if lower.endswith(".xlsx") or lower.endswith(".xls"):
                df = pd.read_excel(path)
                text = df_to_text(df, fname)
                docs.append({"source": fname, "text": text})

            elif lower.endswith(".pdf"):
                text = extract_pdf_text(path)
                docs.append({"source": fname, "text": text})

            else:
                # ignore other file types
                continue

        except Exception as e:
            print(f"[WARN] Failed to load {fname}: {e}")

    print(f"[RAG] Loaded {len(docs)} documents from {DATA_DIR}")
    return docs


# --------- Chunking ---------

def chunk_text(text: str, source: str, chunk_size: int = CHUNK_SIZE,
               overlap: int = CHUNK_OVERLAP) -> List[Dict]:
    """
    Very simple word-based chunking.
    Returns list of {'source', 'chunk_id', 'text'}.
    """
    words = text.split()
    chunks: List[Dict] = []
    start = 0
    chunk_id = 0

    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        chunk_text = " ".join(chunk_words)
        chunks.append(
            {"source": source, "chunk_id": chunk_id, "text": chunk_text}
        )
        chunk_id += 1
        start = end - overlap  # move with overlap

    return chunks


def build_all_chunks(docs: List[Dict]) -> List[Dict]:
    all_chunks: List[Dict] = []
    for doc in docs:
        cks = chunk_text(doc["text"], doc["source"])
        all_chunks.extend(cks)

    print(f"[RAG] Total chunks: {len(all_chunks)}")
    return all_chunks


# --------- Embeddings & FAISS index ---------

print("[RAG] Loading documents & building index...")

_docs = load_all_docs()
_all_chunks = build_all_chunks(_docs)

# Sentence-BERT model
_model = SentenceTransformer("all-MiniLM-L6-v2")

# embeddings for all chunks
_texts = [c["text"] for c in _all_chunks]
_embeddings = _model.encode(_texts, batch_size=32, show_progress_bar=False)
_embeddings = np.array(_embeddings).astype("float32")

# use cosine similarity (inner product on normalized vectors)
faiss.normalize_L2(_embeddings)
_index = faiss.IndexFlatIP(_embeddings.shape[1])
_index.add(_embeddings)

print(f"[RAG] Embedding dim: {_embeddings.shape[1]}, index size: {_index.ntotal}")


# --------- Retrieval & prompt building ---------

def retrieve_chunks(query: str, top_k: int = TOP_K) -> List[Dict]:
    """Return top_k chunks for the query."""
    q_emb = _model.encode([query])
    q_emb = np.array(q_emb).astype("float32")
    faiss.normalize_L2(q_emb)

    D, I = _index.search(q_emb, top_k)
    hits: List[Dict] = []
    for rank, idx in enumerate(I[0]):
        if idx < 0:
            continue
        chunk = _all_chunks[int(idx)].copy()
        chunk["score"] = float(D[0][rank])
        hits.append(chunk)
    return hits


def build_rag_prompt(question: str) -> Tuple[str, List[Dict]]:
    """
    Build a single big prompt string that includes:
    - retrieved context chunks
    - the user's question

    Returns (prompt, used_chunks_list).
    """
    hits = retrieve_chunks(question, TOP_K)

    context_blocks = []
    for h in hits:
        header = f"[Source: {h['source']} | Chunk {h['chunk_id']} | Score: {h['score']:.3f}]"
        context_blocks.append(header + "\n" + h["text"])

    context = "\n\n".join(context_blocks)

    prompt = (
        "You are the SCU Finance Advising Assistant. "
        "You answer questions about the finance major, finance minor, "
        "real estate minor, course offerings, and prerequisites at Santa Clara University.\n\n"
        "Below are some relevant reference materials extracted from official documents "
        "(flowcharts, checklists, excel tables, webpages, etc.). "
        "Use ONLY this information to answer the student's question. "
        "If the answer is not clearly stated, say you are not sure and suggest the student "
        "check the SCU bulletin or contact an academic advisor.\n\n"
        "===== REFERENCE MATERIALS =====\n"
        f"{context}\n\n"
        "===== STUDENT QUESTION =====\n"
        f"{question}\n\n"
        "===== YOUR ANSWER =====\n"
    )

    return prompt, hits

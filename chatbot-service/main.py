import os
from typing import Any
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

PORT = int(os.getenv("PORT", "8010"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("CHAT_OPENAI_API_KEY")
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://127.0.0.1:4000/api")
# Limit how many items we inject to keep prompts small.
BOOK_LIMIT = int(os.getenv("CHATBOT_BOOK_LIMIT", "6"))
CATEGORY_LIMIT = int(os.getenv("CHATBOT_CATEGORY_LIMIT", "8"))

app = FastAPI(title="chatbot-service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str
    content: str


class ChatPayload(BaseModel):
    messages: list[Message]
    model: str | None = None
    temperature: float | None = 0.4


def get_client() -> OpenAI:
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY manquant")
    return OpenAI(api_key=OPENAI_API_KEY)


def fetch_books(limit: int = BOOK_LIMIT) -> list[dict[str, Any]]:
    try:
        resp = requests.get(f"{API_GATEWAY_URL}/books", params={"page": 1, "limit": limit}, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        books = data.get("books") if isinstance(data, dict) else data
        return (books or [])[:limit]
    except Exception as err:  # noqa: BLE001 - log and continue with empty context
        print(f"[chatbot] Impossible de charger les livres depuis {API_GATEWAY_URL}: {err}")
        return []


def fetch_categories(limit: int = CATEGORY_LIMIT) -> list[dict[str, Any]]:
    try:
        resp = requests.get(f"{API_GATEWAY_URL}/books/categories", timeout=5)
        resp.raise_for_status()
        data = resp.json()
        cats = data.get("categories") if isinstance(data, dict) else data
        return (cats or [])[:limit]
    except Exception as err:  # noqa: BLE001 - log and continue with empty context
        print(f"[chatbot] Impossible de charger les catégories depuis {API_GATEWAY_URL}: {err}")
        return []


def build_site_context() -> str:
    books = fetch_books()
    categories = fetch_categories()

    sections: list[str] = []
    if books:
        lines = []
        for book in books:
            title = book.get("title") or "Titre inconnu"
            author = book.get("author") or "Auteur non renseigné"
            category = book.get("category") or book.get("categorie") or "Catégorie inconnue"
            price = book.get("price")
            rent_price = book.get("rentPrice")
            description = (book.get("description") or "").strip()
            desc_preview = (description[:180] + "...") if len(description) > 180 else description
            price_txt = f"achat {price}€" if price is not None else "prix non renseigné"
            if rent_price:
                price_txt += f" | location {rent_price}€"
            lines.append(f"- {title} — {author} (catégorie: {category}, {price_txt}) {desc_preview}")
        sections.append("Livres disponibles (extraits récents):\n" + "\n".join(lines))

    if categories:
        names = [
            cat.get("nom")
            or cat.get("name")
            or cat.get("slug")
            or ""
            for cat in categories
        ]
        names = [n for n in names if n]
        if names:
            sections.append("Catégories actuelles: " + ", ".join(names))

    sections.append(
        "Règles: Réponds uniquement avec les informations fournies ci-dessus et sur les fonctionnalités e-Biblio "
        "(parcours de livres, panier, commandes, profil). Si une réponse n'est pas dans ces données, indique que tu ne sais pas."
    )

    return "\n\n".join(sections)


@app.post("/chat")
async def chat(payload: ChatPayload):
    client = get_client()
    site_context = build_site_context()
    system_message = {
        "role": "system",
        "content": (
            "Tu es l'assistant e-Biblio. Utilise uniquement les données locales ci-dessous "
            "pour répondre et reste centré sur la plateforme. Si l'information n'est pas présente, dis-le simplement.\n\n"
            f"{site_context or 'Aucune donnée locale disponible pour le moment.'}"
        ),
    }

    messages = [system_message] + [m.dict() for m in payload.messages]
    # Avoid unbounded history growth
    if len(messages) > 40:
        messages = [messages[0]] + messages[-39:]

    try:
        response = client.chat.completions.create(
            model=payload.model or DEFAULT_MODEL,
            messages=messages,
            temperature=payload.temperature if payload.temperature is not None else 0.4,
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

    choice = response.choices[0].message
    return {
        "reply": choice.content,
        "model": response.model,
        "usage": response.usage.dict() if hasattr(response, "usage") else None,
    }


@app.get("/")
async def root():
    return {"status": "chatbot-service ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)

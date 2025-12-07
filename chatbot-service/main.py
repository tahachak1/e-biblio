import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

PORT = int(os.getenv("PORT", "8010"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("CHAT_OPENAI_API_KEY")
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

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


@app.post("/chat")
async def chat(payload: ChatPayload):
    client = get_client()
    try:
        response = client.chat.completions.create(
            model=payload.model or DEFAULT_MODEL,
            messages=[m.dict() for m in payload.messages],
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

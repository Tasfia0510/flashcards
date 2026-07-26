"""
Everything pdf and ai related lives here
1. extract text/formulas out of pdf
2. convert pdf content to markdown and Latex format
3. split text into chunks by headings 
4. ask OpenAI for flashcards
"""

import os
from pathlib import Path
import tempfile

import pymupdf
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

DEPTH_INSTRUCTIONS = {
    "concise": (
        "Create one flashcard per distinct fact or concept. "
        "Keep cards focused and few - the minimum needed to cover everything."
    ),
    "standard": (
        "Create one flashcard per distinct fact or concept, including "
        "minor details, definitions, and thorough examples as their own cards."
    ),
}

def build_prompt(depth: str) -> str:
    return (
        "Look at this page and create flashcards from it. "
        "Every topic and concept on the page must be covered by at least "
        "one card - never skip or omit anything. "
        f"{DEPTH_INSTRUCTIONS[depth]} "
        "Write every mathematical equation using LaTeX, wrapped in $ for "
        "inline math or $$ for display equations - never skip or "
        "approximate a formula, whether it appears as regular text or as "
        "an image on the page. "
        "Ignore repeated page headers, footers, and page numbers entirely - "
        "do not create cards from them. "
        "Respond with ONLY a JSON array, no other text. Each item: "
        '{"front": "question", "back": "answer"}.'
    )


# receives a pdf upload from FastAPI, returns with a list with {front, back}-cards
def generate_flashcards(file, depth: str = "standard") -> list[dict]:
    pdf_bytes = file.file.read()
    if not pdf_bytes:
        raise ValueError("PDF file is empty")

    # opens the pdf
    document = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    prompt = build_prompt(depth)
    
    # creates an empty list where the full markdown will be, looped for every page
    all_cards = []
    for page in document:
        pixmap = page.get_pixmap(dpi=150)
        png_bytes = pixmap.tobytes("png")

        # sends the image and the promt to gemini
        response = client.models.generate_content(
            model=MODEL,
            contents=[
                types.Part.from_bytes(data=png_bytes, mime_type="image/png"),
                PROMPT,
            ],
        )
        raw = response.text.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        page_cards = json.loads(raw)
        all_cards.extend(page_cards)

    document.close()
    return all_cards

"""
# temporary
def generate_flashcards(text: str) -> list[dict]:
    return [
        {
            "front": "Question 1",
            "back": "Answer to Question 1"
        },

        {
            "front": "Question 2",
            "back": "Answer to Question 2"   
        }
    ]
"""
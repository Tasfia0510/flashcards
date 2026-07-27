"""
Everything pdf and ai related lives here with gemini
1. extract text/formulas out of pdf (all pages as images)
2. convert pdf content to markdown and Latex format
4. generate cards directly 
"""

import os
from pathlib import Path
import tempfile

import json
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
        "minor details, definitions, and vocabularies"
    ),
    "thorough": (
        "Create one flashcard per distinct fact or concept, including "
        "minor details, definitions, and thorough examples as their own cards. "
    ),
}

def build_prompt(depth: str) -> str:
    return (
        "Look at all pages of the uploaded PDF and create a complete flashcard deck."
        "Generate flashcards in the same language as the uploaded document"
        "Every topic and concept on the page must be covered by at least "
        "one card - never skip or omit anything. "
        "Do not create duplicate cards."
        f"{DEPTH_INSTRUCTIONS[depth]} "
        "Use the exact terminology, wording, and phrasing from the original "
        "material wherever possible - do not paraphrase, simplify, or rewrite "
        "in different words. When converting a definition or explanation into "
        "a flashcard, keep it as close to the source text as possible, just "
        "reformatted into question/answer form. "
        "If the source text is unclear, incomplete, or contains errors, fix it "
        "and write clearly - the preservation rule applies to correct, clear text. "
        "Be as detailed as the source material supports - do not shorten, "
        "summarize, or drop specificity for the sake of brevity. "
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
    
    # get all pages as images first before 
    page_images = []
    for page in document:
        pixmap = page.get_pixmap(dpi=150)
        png_bytes = pixmap.tobytes("png")
        page_images.append(types.Part.from_bytes(data=png_bytes, mime_type="image/png"))
    document.close()

    prompt = build_prompt(depth)

    response = client.models.generate_content(
        model=MODEL,
        contents=[*page_images, prompt],
        )

    raw = response.text.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)

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
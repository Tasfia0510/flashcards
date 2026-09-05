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
import demjson3

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

DEPTH_INSTRUCTIONS = {
    "concise": (
        "Create one flashcard per distinct fact or concept. "
        "Keep cards focused and few - the minimum needed to cover everything." 
        "Each card should cover a significant, high-level concept."
    ),
    "standard": (
        "Create cards for all important concepts including definitions, formulas, "
        "and core principles. Group related sub-topics into single cards where possible. "
        "Skip redundant information and include examples."
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
         "IMPORTANT JSON RULES:\n"
        "- Respond with ONLY a valid JSON object, no other text.\n"
        "- The JSON must be in this exact format: {\"cards\": [{\"front\": \"question\", \"back\": \"answer\"}]}\n"
        "- Use double quotes for all strings.\n"
        "- NO trailing commas after the last item in arrays or objects.\n"
        "- Escape special characters: newline as \\n, backslash as \\\\, quotes as \\\".\n"
        "- Do not wrap the JSON in markdown code blocks.\n"
        "- Do not add any explanation or text before or after the JSON.\n"
        "- Ensure all commas between objects and properties are correct.\n"
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
    
    data = demjson3.decode(raw)
    
    # Om data är ett objekt med 'cards' som är en dict
    if isinstance(data, dict) and "cards" in data:
        cards = data["cards"]
        # Om cards är en dict, konvertera till lista
        if isinstance(cards, dict):
            return list(cards.values())
        # Om cards är en lista, returnera den
        elif isinstance(cards, list):
            return cards
    
    # Om data är en dict med numeriska nycklar
    if isinstance(data, dict):
        # Kolla om alla nycklar är siffror
        if all(str(k).isdigit() for k in data.keys()):
            return list(data.values())
        # Om data har 'front' och 'back', returnera som enskilt kort
        if "front" in data and "back" in data:
            return [data]
    
    # Om data är en lista
    if isinstance(data, list):
        return data
    
    # Fallback
    return []

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
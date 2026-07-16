"""
Main file for the FastAPI backend
"""

# all important imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import (
    create_tables,
    save_deck, 
    get_deck,
    list_decks,
    reset_database,
)
from flashcard_generator import generate_flashcards

# create the FastAPI (backend) application
app = FastAPI(
    title = "Flashcard Generator",
    description = "AI powered tool that converts study notes into flashcards while preserving the original terminology and concepts"
)

create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# for testing: creates a URL for http://localhost:8000
@app.get("/")
def home():
    return {
        "message": "backend running"
    }

# get all decks
@app.get("/decks")
def read_decks():
    return list_decks()

# get one deck
@app.get("/decks/{deck_id}")
def read_deck(deck_id:int):
    deck = get_deck(deck_id)

    if deck is None:
        return {
            "error": "deck not found "
        }
    return deck

# generate a fake deck for testing 
@app.post("/generate")
def generate():
    text = "Example study notes"
    cards = generate_flashcards(text)

    deck_id = save_deck("Example deck", cards)

    return {
        "message": "deck created",
        "deck_id": deck_id, 
        "cards": cards
    }

@app.delete("/reset")
def reset():
    reset_database()
    return("message:" "database cleared")
"""
Main file for the FastAPI backend
"""

# all important imports
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from database import (
    create_tables,
    create_deck, 
    get_deck,
    reset_database,
    create_folder,
    list_folders,
    delete_folder,
    list_decks_by_folder,
)
from document_processor import generate_flashcards

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

@app.delete("/reset")
def reset():
    reset_database()
    return("message:" "database cleared")

# DECKS
# get one deck
@app.get("/decks/{deck_id}")
def read_deck(deck_id:int):
    deck = get_deck(deck_id)

    if deck is None:
        return {
            "error": "deck not found "
        }
    return deck

# create a deck inside a folder 
@app.post("/folders/{folder_id}/decks")
def create_deck(folder_id:int, name:str):
    text = "Example study notes"
    cards = generate_flashcards(text)

    deck_id = save_deck(
        folder_id=folder_id,
        name=name,
        cards=cards
    )

    return {
        "message": "deck created",
        "deck_id": deck_id, 
        "cards": cards
    }

# FOLDERS
@app.get("/folders")
def read_folders():
    return list_folders()

@app.post("/folders")
def create_new_folder(name: str):
    folder_id = create_folder(name)
    return {
        "message": "folder created",
        "folder name": name,
        "folder id": folder_id
    }

@app.delete("/folders/{folder_id}")
def remove_folder(folder_id:int):
    delete_folder(folder_id)

    return {
        "message": "folder deleted"
    }

@app.get("/folders/{folder_id}/decks")
def read_folder_decks(folder_id:int):
    return list_decks_by_folder(folder_id)

# PDF 
# pdf upload testing - is not saved  
@app.post("/upload")
def upload_pdf(file: UploadFile = File(...), depth:str = "standard"):
    cards = generate_flashcards(file, depth)
    return {"filename": file.filename, "cards": cards}
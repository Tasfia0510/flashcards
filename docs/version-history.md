# Version History

**PURPOSE**
<br>
This document tracks the development and major versions of the project. This is not ment for users, but mostly for me to see my own progress and learning with notes, sources and my own thoughts and research. 

---
## Version 0.1 - Backend foundation and Database Architecture
The goal was to create the database with all tables and to set up the FastAPI to connect between the future frontend and the database. 

---

**IMPLEMENTED**
- Set up the backend with Python, FastAPI and PostgreSQL

- Set up a PostgreSQL database locally

- Created the first database schema

- Created a database connection with Python 

- Created functions for:
    - creating tables
    - saving decks
    - saving cards
    - retrieving all decks 
    - retrieving individual decks

- Created fake flashcards to test communication between backend and PostgreSQL 

---

**CURRENT DATABASE SCHEMA**
<br>
User should first create a folder - which is meant for a subject or a course, for example called "Calculus II" and then create the actual card decks inside it, for example: "Definitions and Concepts" and "Practice Questions". 

<br>

<img width="773" height="198" alt="Screenshot 2026-07-16 at 19 25 34" src="https://github.com/user-attachments/assets/89f8cd93-1b38-48f2-a028-87c9d00f5b76" />

<br>

So far, there are One-To-Many and Many-To-Many relationships:
```
One folder
     |
     |
     ↓
Many decks
     |
     |
     ↓
Many cards
```

---

**FastAPI ROUTE**
<br>
Currently using Swagger UI (`/docs`) to test the backend API. Swagger allows testing the API without a functioning frontend. 

<br>

The _backend API_ is the part of our application that allows the frontend to communicate with our backend. In this project, the backend API is the _FastAPI_. 

<br>

It currently shows:
- `GET /` - used to verify that the backend is running 
- `GET /decks` - return all decks, in the future the goal is to display all the available flashcard decks for each folder 
- `GET /decks/{deck_id}` - return one specific deck with its cards
- `POST /generate` - temporary testing for creating the flashcards

<br>

We are using _JSON_ (JavaScript Object Notation) as a format used to transfer data between backend and frontend. FastAPI automatically converts Python dictionaries into JSON responses. 

## Version 0.2 - Folder management and PDF pipeline processing
The goal was to improve the backend structure by organizing decks inside folders and creating the first step of the document processing pipeline. The system should now be able to create decks inside specific folders, receive PDF documents and extract structured text from PDFs. 

---

**IMPLEMENTED**
- Added the functions for:
     - "create folder" function 
     - "get all folders" function (for menu)
     - "delete folder" function

- Added folder routes to FastAPI
     - New route: `POST /folders/{folder_id}/decks` instead of `POST /decks`

- Added `POST /upload` to upload PDF:s

- Created function that can extract and return the PDF content in markdown format to later make flashcards organised by headings, bulletpoints etc

- Created a requirements file with important installations for this project

---

**UPDATED USER FLOW**
```
POST /folders: create new folder 
↓
POST /folders/{folder_id}/decks: create a deck inside one folder
↓
GET /folders: menu shows all the folders a users has created 
↓
GET /folders/{folder_id}/decks: shows us all the decks we have created for that folder (folder_id)
↓
GET /decks/{deck_id}: shows us all the cards in the specific deck (deck_id)
```

---

**INSTALLATIONS**
_python-multipart_ was installed because a PDF is a different type of HTTP-request, compared to JSON text. That is why FastAPI needs a library that can unpack the PDF file.

<br>

The most important part is to get the backend to read the PDF file. _pymupdf_ is responsible for opening and reading files while _pymupdf4llm_ is for formatting, to convert it into markdown optimized for LLM processing. 

<br>

**Sources for these installations**:

<br>
- https://pypi.org/project/pymupdf4llm/
<br>
- https://onlyoneaman.medium.com i-tested-7-python-pdf-extractors-so-you-dont-have-to-2025-edition-c88013922257
<br>
- https://www.reddit.com/r/LangChain/comments/1e7cntq/whats_the_best_python_library_for_extracting_text/ (also know that this is not the best source but i trust my reddit pals more than anything)


# Version History

**PURPOSE**
<br>
This document tracks the development progress and major versions of the project

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

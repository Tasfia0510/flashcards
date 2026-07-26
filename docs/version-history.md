# Version History

### PURPOSE
<br>
This document tracks the development and major versions of the project. This is not ment for users, but mostly for me to see my own progress and learning with notes, sources and my own thoughts and research. 

---
## Version 0.1 - Backend foundation and Database Architecture
The goal was to create the database with all tables and to set up the FastAPI to connect between the future frontend and the database. 

---

### IMPLEMENTED
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

### CURRENT DATABASE SCHEMA
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

### FastAPI ROUTE
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

## Version 0.2 - Folder management and start of the PDF pipeline 
The goal was to improve the backend structure by organizing decks inside folders and creating the first step of the document processing pipeline. The system should now be able to create decks inside specific folders, receive PDF documents and extract structured text from PDFs. 

---

### IMPLEMENTED
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

### UPDATED USER FLOW
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

### INSTALLATIONS
_python-multipart_ was installed because a PDF is a different type of HTTP-request, compared to JSON text. That is why FastAPI needs a library that can unpack the PDF file.

<br>

The most important part is to get the backend to read the PDF file. _pymupdf_ is responsible for opening and reading files while _pymupdf4llm_ is for formatting, to convert it into markdown optimized for LLM processing. 

<br>

### SOURCES FOR THESE INSTALLATIONS:
- https://pypi.org/project/pymupdf4llm/
- https://onlyoneaman.medium.com i-tested-7-python-pdf-extractors-so-you-dont-have-to-2025-edition-c88013922257
- https://www.reddit.com/r/LangChain/comments/1e7cntq/whats_the_best_python_library_for_extracting_text/ (also know that this is not the best source but i trust my reddit pals more than anything)

---

### THE PDF PIPELINE SO FAR:
```
User uploads PDF
↓
POST /upload
↓
PyMuPDF4LLM extracts Markdown
↓
Return extracted text
```

### PLANNED PDF PIPELINE


## Version 0.3 - AI powered PDF processing and flashcard generation
The goal was to solve the biggest limitation from Version 0.2: preserving mathematical content when processing PDFs. This is especially important because most of my study material is mathematics, where formulas contain essential information and cannot be treated as normal text.

Most important architectural change was the use of AI in pdf processing. The system now processes the entire document and uses AI to directly generate flashcards while preserving mathematical notation.

---

### IMPLEMENTED
The PDF processing system was redesigned. `pymupdf4llm` was removed because Gemini now handles the understanding and formatting of the document. The backend can now receive a PDF, convert all pages into images, send them to Gemini, and receive structured flashcards in JSON format.

<br>

The prompt was also improved to make sure that:
- formulas are always written in LaTeX
- the original language of the document is preserved
- all concepts are covered
- unnecessary formatting is ignored

<br>

- Different generation depths were also added, allowing the user to choose between concise, standard and thorough flashcard generation.

---

### PROBLEMS IDENTIFIED
The main challenge was preserving all important information from mathematical PDFs. A PDF is not structured like normal text. Mathematical content can appear as normal text, embedded images, LaTeX-rendered formulas, diagrams and figures. The previous pipeline from Version 2 could not reliably understand the difference between these elements. Three main issues were identified:

- **Issue 1: Mathematical formulas were represented incorrectly**

  Mathematical expressions were extracted as normal text. For example, a formula such as `x^2` could be represented as `x2`, meaning the mathematical meaning was lost.

- **Issue 2: Images containing formulas were ignored**

  Some formulas were stored inside images in the PDF. The extraction pipeline did not recognize these images as mathematical expressions, causing important formulas to disappear.

- **Issue 3: Non-formula images should be preserved**

  Images such as diagrams, graphs and illustrations contain important learning information. They should not be removed and should eventually be shown in relevant flashcards.

---

### SOLUTIONS
- **Solution 1 - Pix2Text (Failed)**

The first solution investigated was Pix2Text because it is an open-source alternative to Mathpix and specifically designed for mathematical document understanding.

The reason it looked promising was that it combined several important components. It had Mathematical Formula Detection (MFD), which identifies formulas inside documents, Mathematical Formula Recognition (MFR), which converts formulas into LaTeX, and a layout model that separates different parts of a document such as text, formulas, tables and images.

This would theoretically solve all three identified problems because formulas could be detected regardless of whether they were written as text or stored as images, while diagrams and other figures could be identified separately.

However, the solution failed because Pix2Text required `torch==2.4.0`, which was not compatible with my Intel Mac. 

<br>

- **Solution 2 - Pix2Text using Docker (Failed)**

Solution 2 was to use `pix2text` but with Docker. Docker was tested to bypass macOS dependency issues by running Pix2Text inside a Linux environment eradicating the problem with Solution 1. However, the downside was that the model was extremely slow. 

<br>

- **Solution 3: Google Gemini Vision API (Current Solution)**

The final solution was to use Gemini's multimodal capabilities instead of combining several separate models.

Instead of extracting text first, each PDF page is converted into an image and sent directly to Gemini. This allows the model to understand the complete page visually, including text, formulas and mathematical notation.

Gemini is instructed to generate flashcards directly while preserving the original language of the document, converting mathematical expressions into LaTeX format, and ignoring unnecessary elements such as headers, footers and page numbers.

Issue 3 will be added as an "advanced feature". 

---

### UPDATED PDF PIPELINE
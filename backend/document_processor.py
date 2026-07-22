"""
Everything pdf and ai related lived here
1. extract text out of pdf
2. convert pdf content to markdown format
3. split text into chunks by headings 
4. ask OpenAI for flashcards 
"""

"""
This is a temporary function
Later this will use OpenAI
"""

# pymupdf is the core library - it knows how to open a PDF and read it
import pymupdf

"""
pymupdf4llm is built on top of pymupdf. 
It turns it contents into clean Markdown format, emphasizing the headings, bullets etc making better cards
Its only job is formatting 
"""
import pymupdf4llm

# regular expressions
import re

# reduces duplication by stripping repeated header/footer 
def remove_duplication(markdown: str, pdf_title: str) -> str:
    footer_pattern = re_escape(pdf_title) + r"\s*\n+\s*\d+\s*\n+"
    return re.sub(footer_pattern, "", markdown)

# returns markdown format before sending it to LLM to split it into headings 
def extract_pdf_text(file) -> str:
    pdf_bytes = file.file.read()

    if not pdf_bytes:
        raise ValueError("PDF file is empty")

    document = pymupdf.open(
        stream=pdf_bytes,
        filetype="pdf"
    )
    
    # parses the raw bytes 
    document = pymupdf.open(stream=pdf_bytes, filetype="pdf")

    markdown = pymupdf4llm.to_markdown(document)
    remove_duplication()
    document.close()
    return markdown

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
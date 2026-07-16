# pdf text extraction in chunks and use OpenAI to generate the flashcards
"""
Everything pdf and ai related lived here
1. extract text out of pdf
2. split text into chunks by headings 
3. ask OpenAI for flashcards 
"""

"""
This is a temporary function
Later this will use OpenAI
"""

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
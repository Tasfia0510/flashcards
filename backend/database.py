"""
Eveything database related lives in this file 
Purpose of this file is to:

1. connect FastAPI with PostgreSQL
2. make a database to store all the created decks of cards, with topics and later spaced repition
"""

# this os module provides functions for interacting with the computers operating system, allowing python code to work across Windows, macOS, and Linux platforms
# good source: https://www.codecademy.com/resources/docs/python/os-module
import os
# connect python with postgreSQL
import psycopg2
import psycopg2.extras
# imports functions that can read the .env file
# an env file stores sensitive credentials (so no hardcode)
from dotenv import load_dotenv

# load variables from .env file
load_dotenv()

def connect_database():
    connection = psycopg2.connect(
        host=os.getenv("DATABASE_HOST"),
        database=os.getenv("DATABASE_NAME"),
        user=os.getenv("DATABASE_USER"),
        password=os.getenv("DATABASE_PASSWORD"),
        port=os.getenv("DATABASE_PORT")
    )
    return connection 

# SERIAL means auto-incrementing integer, postgre picks the number by itself 
# deck_id is a foriegn key, a copy of id from decks table, it is not a new identifier hence no SERIAL 

def create_tables():
    connection = connect_database()
    # create a cursor, the cursor allows you to execute database queries
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS folders (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS decks (
            id SERIAL PRIMARY KEY,
            folder_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT fk_decks_folder_id FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE CASCADE
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cards (
            id SERIAL PRIMARY KEY,
            deck_id INTEGER NOT NULL, 
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            CONSTRAINT fk_cards_deck_id FOREIGN KEY(deck_id) REFERENCES decks(id) ON DELETE CASCADE
        );
    """)

    connection.commit()
    cursor.close()
    connection.close()

def save_deck(name: str, cards: list[dict]) -> int:
    # saves a deck, and its cards
    # the cards are a list of {"front:"..., "back:..."}
    connection = connect_database()
    cursor = connection.cursor()

    cursor.execute("INSERT INTO decks (name) VALUES (%s) RETURNING id;", (name,))
    # get deck_ide with fetchone
    deck_id = cursor.fetchone()[0]

    for card in cards:
        cursor.execute(
            "INSERT INTO cards (deck_id, front, back) VALUES (%s, %s, %s)", (deck_id, card["front"], card["back"]),
        )
    
    connection.commit()
    cursor.close()
    connection.close()
    return deck_id

def get_deck(deck_id: int) -> dict | None:
    # returns one deck with all of its cards, for studying
    connection = connect_database()
    # RealDictCursor changes it to a more convenient format than tuple string 
    cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # get the deck info
    cursor.execute(
        "SELECT id, name, created_at FROM decks WHERE id = %s;", (deck_id,)
    )
    deck = cursor.fetchone()

    # if the deck exist, get all the cards from it 
    if deck:
        cursor.execute(
            "SELECT id, front, back FROM cards WHERE deck_id = %s ORDER BY id;", (deck_id,)
        )
        deck["cards"] = cursor.fetchall()

    cursor.close()
    connection.close()
    return deck

def list_decks():
    # returns a list of all the decks, returns every deck with how many cards each has
    connection = connect_database()
    cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # inner join only shows where both table match (match in id from cards and deck)
    # left join will show us every deck
    cursor.execute("""
        SELECT d.id, d.name, d.created_at, COUNT(c.id) AS total_cards
        FROM decks d 
        LEFT JOIN cards c ON c.deck_id = d.id
        GROUP BY d.id
        ORDER BY d.created_at DESC
    """)
    decks = cursor.fetchall()

    cursor.close()
    connection.close()
    return decks

def reset_database():
    connection = connect_database()
    cursor = connection.cursor()

    # TRUNCATE deletes all rows at once, while DELETE removes each row individually (faster on larger tables)
    # RESTART IDENTITY CASCADE counts the deck_id from 1, restarts the counter
    cursor.execute(
        "TRUNCATE decks, cards RESTART IDENTITY CASCADE;"
    )

    connection.commit()
    cursor.close()
    connection.close()  
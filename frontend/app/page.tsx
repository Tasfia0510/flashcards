// tells next.js to run the file in browser
"use client";

// useState and useEffect are react hooks 
// useState remembers values and useEffect automatically runs code at specific moments
import { useEffect, useState } from "react";

// address to backend
const API = "http://localhost:8000";

// "type" is typescript and defines shape of an object
type Folder = {id: number; name: string};
type Deck = {id: number; name: string; card_count: number};

// export default means that this is the main thing this file provides (react)
// everything inside this function belongs to the main page
export default function FlashcardsPage() {
    // useState<TYPE>(startvalue): returns two values in an array:
    // 1) current value and 2) a function to change that value

    // array of folders fetched from postgresql
    const [folders, setFolders] = useState<Folder[]>([]);
    // ids of folders that are expanded
    const [expandedFolders, setExpandedFolders] = useState<number[]>([]);
    const [decks, setDecks] = useState<Record<number, Deck[]>>({});
    // for creating a new folders name 
    const [newFolderName, setNewFolderName] = useState(""); 
    // name of the deck being created 
    const [deckName, setDeckName] = useState("");
    // a user feedback message when creating the deck
    const [status, setStatus] = useState(""); 

    useEffect(() => {
        loadFolders();
    }, []);

    /**
     * GET /folders - fetch the list of existing folders from the backend
     * fetches the complete list of folders with FastAPI and updates the local state
     */
    async function loadFolders() {
        try {
            const res = await fetch(`${API}/folders`);
            if (!res.ok) throw new Error(`Failed to fetch folders: ${res.status}`);
            const data = await res.json();
            setFolders(data);
        } catch (error) {
            console.error("Error loading folders:", error);
            setStatus("Failed to load folders");
        }
    }

    /**
     * opens or closes a folder with toogles 
     */
    async function toogleFolders(folderId: number) {
        // check if the folder is expanded
        const isExpanded = expandedFolders.includes(folderId);

        if (isExpanded) {
            setExpandedFolders(
                expandedFolders.filter((id) => id !== folderId)
            );
            return;  
        }

        try {
            const res = await fetch(`${API}/folders/${folderId}/decks`);

        if (!res.ok) {
            throw new Error(`Failed to fetch decks: ${res.status}`);
        }

        const data = await res.json()

        setDecks({
            ...decks,
            [folderId]: data,
        });

        setExpandedFolders([
            ...expandedFolders,
            folderId, 
        ]);
        } catch (error) {
            console.error("Error loading decks:", error)
            setStatus("Failed to load decks");
        }
    } 
        
    // POST /folders - create a new folder
    async function handleCreateFolder() {
        // do nothing if the input is empty 
        if (!newFolderName.trim()) return; 

        try {
            const res = await fetch(
                `${API}/folders?name=${encodeURIComponent(newFolderName)}`,
                { method: "POST"}
            );
            if (!res.ok) throw new Error(`Failed to create folder: ${res.status}`);
            const data = await res.json();

            await loadFolders();                    // refresh the folder list 
            setNewFolderName("");                   // clear the input field
        } catch (error) {
            console.error("Error creating folder:", error);
            setStatus("Failed to create folder");
        }
    }

    /**
     * // POST /folders/{folder_id}/generate 
    async function handleFileUpload(file: File) {
        if (!selectedFolderId) {
            setStatus("Pick a folder");
            return;
        }

        // strip the ".pdf" for a default deck name
        const name = file.name.replace(/\.pdf$/i, "");
        const form = new FormData();
        form.append("file", file);

        try {
            const url = `${API}/folders/${selectedFolderId}/generate?name=${encodeURIComponent(name)}&depth=standard`;
            const res = await fetch(url, { method: "POST", body: form});
            if (!res.ok) throw new Error(`Failed to generate cards: ${res.status}`);
            const data = await res.json();

            setCards(data.cards);
            setDeckName(name);
            setStatus(`Got ${data.cards.length} cards.`);
        } catch (error) {
            console.error("Error generating cards:", error);
            setStatus("Failed to generate cards from PDF");
        }
    }

    // POST /folders/{id}/decks - save the generated cards as a real deck
    async function handleSaveDeck() {
        if (!selectedFolderId) return;

        setStatus("Saving deck...");
        try {
            const url = `${API}/folders/${selectedFolderId}/decks?name=${encodeURIComponent(deckName)}`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cards: cards}),
            });
            if (!res.ok) throw new Error(`Failed to save deck: ${res.status}`);

            setStatus("Deck saved!");
            setCards([]); // clear the cards, ready to start again
        } catch (error) {
            console.error("Error saving deck:", error);
            setStatus("Failed to save deck");
        }
    }
     */

    return (
        <main className="p-8">

            <h1 className="text-3xl font-bold mb-8">
                My Flashcards
            </h1>


            {/* ----------------------------------------- */}
            {/* CREATE FOLDER */}
            {/* ----------------------------------------- */}

            <section className="mb-8">

                <h2 className="text-xl font-semibold mb-3">
                    Create a folder
                </h2>

                <div className="flex gap-2">

                    <input
                        value={newFolderName}
                        onChange={(e) =>
                            setNewFolderName(e.target.value)
                        }
                        placeholder="Folder name"
                        className="border rounded px-3 py-2"
                    />

                    <button
                        onClick={handleCreateFolder}
                        className="border rounded px-4 py-2"
                    >
                        Add folder
                    </button>

                </div>

            </section>


            {/* ----------------------------------------- */}
            {/* STATUS */}
            {/* ----------------------------------------- */}

            {status && (
                <p className="mb-4 text-gray-600">
                    {status}
                </p>
            )}


            {/* ----------------------------------------- */}
            {/* FOLDERS */}
            {/* ----------------------------------------- */}

            <section>

                <h2 className="text-xl font-semibold mb-4">
                    Folders
                </h2>


                {folders.length === 0 ? (

                    <p className="text-gray-500">
                        No folders yet.
                    </p>

                ) : (

                    <div className="space-y-3">

                        {folders.map((folder) => {

                            // Is this folder currently open?
                            const isExpanded =
                                expandedFolders.includes(
                                    folder.id
                                );

                            // Get the decks belonging to this folder
                            const folderDecks =
                                decks[folder.id] || [];


                            return (
                                <div
                                    key={folder.id}
                                    className="border rounded-lg"
                                >

                                    {/* FOLDER HEADER */}

                                    <button
                                        onClick={() =>
                                            toogleFolders(
                                                folder.id
                                            )
                                        }
                                        className="w-full flex justify-between items-center p-4 text-left"
                                    >

                                        <span className="font-medium">

                                            {isExpanded
                                                ? "▼"
                                                : "▶"}

                                            {" "}

                                            {folder.name}

                                        </span>


                                        <span className="text-gray-500">

                                            {folderDecks.length}{" "}
                                            {folderDecks.length === 1
                                                ? "deck"
                                                : "decks"}

                                        </span>

                                    </button>


                                    {/* DECKS */}

                                    {isExpanded && (

                                        <div className="border-t">

                                            {folderDecks.length === 0 ? (

                                                <div className="p-4 text-gray-500">
                                                    No decks in this folder yet.
                                                </div>

                                            ) : (

                                                <div>

                                                    {folderDecks.map(
                                                        (deck) => (

                                                            <div
                                                                key={deck.id}
                                                                className="flex justify-between items-center px-6 py-3 border-b last:border-b-0"
                                                            >

                                                                <span>
                                                                    {deck.name}
                                                                </span>

                                                                <span className="text-gray-500">

                                                                    {deck.card_count}{" "}
                                                                    {deck.card_count === 1
                                                                        ? "card"
                                                                        : "cards"}

                                                                </span>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            )}

                                        </div>

                                    )}

                                </div>
                            );
                        })}

                    </div>

                )}

            </section>

        </main>
    );
}
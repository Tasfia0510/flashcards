// tells next.js to run the file in browser
"use client";

// useState and useEffect are react hooks 
import { useEffect, useState, useMemo} from "react";
import React from "react";
import Image from "next/image";
import katex from "katex";
import "katex/dist/katex.min.css";

// address to backend
const API = "http://localhost:8000";

// "type" is typescript and defines shape of an object
type Folder = { id: number; name: string };
type Deck = { id: number; name: string; card_count: number };
type Card = { front: string; back: string };

type CardDeckVisualProps = {
  front: string;
  back: string;
  showAnswer: boolean;
  onReveal: () => void;
  category?: string;
};

export function CardDeckVisual({
  front,
  back, 
  showAnswer,
  onReveal,
  category,
}: CardDeckVisualProps) {
  return (
    <div className="relative flex min-h-[680px] w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-50 p-6">

      {/* pile of cards */}
      <div className="relative w-full max-w-2xl">

        {/* lowest card (rotated a bit to the left) */}
        <div className="absolute inset-0 rotate-[-2.5deg] rounded-2xl bg-[#ece7df] shadow-md border border-neutral-300/40" />

        {/* middle card (rotated a bit to the right) */}
        <div className="absolute inset-0 rotate-[1.5deg] rounded-2xl bg-[#f0ebe2] shadow-lg border border-neutral-300/50" />

        {/* front card, most important, adjust height */}
        <div
          onClick={onReveal}
          className="relative flex h-[600px] w-full cursor-pointer flex-col overflow-y-auto rounded-2xl bg-neutral-50 p-8 shadow-2xl border border-neutral-200 transition-all hover:-translate-y-1"
        >
          {category && (
            <span className="font-serif text-sm text-neutral-500 mb-4 tracking-wide">
              {category}
            </span>
          )}

          {/* Fråga - alltid synlig */}
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Question
          </p>
          <div className="font-serif text-2xl text-neutral-800 font-normal">
            <LatexRenderer content={front || "(empty)"} />
          </div>

          {/* Svar - avslöjas under, inget vändande */}
          {showAnswer && (
            <>
              <div className="my-6 border-t border-neutral-300/60" />
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Answer
              </p>
              <div className="font-serif text-xl text-neutral-700">
                <LatexRenderer content={back} />
              </div>
            </>
          )}

          <p className="mt-6 text-center text-xs text-neutral-400">
            {showAnswer ? "Press space or click for next card" : "Press space or click to reveal"}
          </p>
        </div>

      </div>
    </div>
  );
}

function LatexRenderer({ content }: { content: string }) {
    // saves calculation time
    const html = useMemo(() => {
      let processed = content;
      processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return `\\[${math}\\]`;
        }
      });
      processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return `$$${math}$$`;
        }
      });
      processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `\\(${math}\\)`;
        }
      });
      processed = processed.replace(/\$([^\$\s][^\$]*?[^\$\s]|\S)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `$${math}$`;
        }
      });

      return processed;
    }, [content]);

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }

function MathField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);

  // editing mode: shows source code when clicked
  if (editing) {
    return (
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        rows={3}
        className="w-full resize-none text-lg font-medium text-neutral-900 border border-indigo-400 p-2 rounded-lg focus:outline-none"
      />
    );
  }

  // shows the beautiful math, when hovering, a grey border is formed around the equation
  return (
    <div
      onClick={() => setEditing(true)}
      className="min-h-[3rem] cursor-text text-lg font-medium text-neutral-900 p-2 rounded-lg hover:bg-slate-100/70 border border-transparent hover:border-slate-200 transition"
      title="Click to edit LaTeX"
    >
      <LatexRenderer content={value || "Click to add text or LaTeX..."} />
    </div>
  );
}

function LatexEditor({ 
  value, 
  onChange, 
  label 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  label: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium uppercase text-neutral-400">{label}</label>
        {!isEditing && (
          <button
            onClick={() => {
              setTempValue(value);
              setIsEditing(true);
            }}
            className="text-xs text-neutral-400 hover:text-neutral-700"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            className="w-full resize-none rounded-lg border border-neutral-200 p-3 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            placeholder={`Enter ${label.toLowerCase()} with LaTeX ($...$ for inline, $$...$$ for display)`}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-neutral-900 px-3 py-1 text-sm text-white hover:bg-neutral-800"
            >
              Save
            </button>
          </div>
          <div className="text-xs text-neutral-400">
            Press ⌘+Enter to save, Esc to cancel
          </div>
        </div>
      ) : (
        <div 
          onClick={() => {
            setTempValue(value);
            setIsEditing(true);
          }}
          className="min-h-[60px] cursor-text rounded-lg p-2 hover:bg-neutral-50"
        >
          {value.trim() ? (
            <LatexRenderer content={value} />
          ) : (
            <span className="text-neutral-400">Click to add {label.toLowerCase()}...</span>
          )}
        </div>
      )}
    </div>
  );
}

type SetupScreenProps = {
  setView: (view: "menu" | "create") => void;
  file: File | null;
  setFile: (file: File | null) => void;
  depth: "concise" | "standard";
  setDepth: (depth: "concise" | "standard") => void;
  deckName: string;
  setDeckName: (name: string) => void;
  createFolderId: number | null;
  setCreateFolderId: (id: number | null) => void;
  folders: Folder[];
  status: string;
  handleGenerate: () => void;
};

function SetupScreen({
  setView,
  file,
  setFile,
  depth,
  setDepth,
  deckName,
  setDeckName,
  createFolderId,
  setCreateFolderId,
  folders,
  status,
  handleGenerate,
}: SetupScreenProps) {
  return (
    <div className="mx-auto max-w-xl">
      <button onClick={() => setView("menu")} className="mb-6 text-sm text-neutral-500 hover:text-neutral-700">
        ← Back
      </button>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <label className="mb-2 block text-sm font-medium text-neutral-700">Upload a PDF</label>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 py-10 text-sm text-neutral-500 hover:border-neutral-400">
          {file ? file.name : "Drop a PDF here or click to choose"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </label>

        <label className="mb-2 mt-6 block text-sm font-medium text-neutral-700">Depth</label>
        <div className="flex gap-2">
          {(["concise", "standard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDepth(d)}
              className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                depth === d
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Deck name</label>
            <input
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Optional - defaults to filename"
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Folder</label>
            <select
              value={createFolderId ?? ""}
              onChange={(e) => setCreateFolderId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        {status && <p className="mt-4 text-sm text-neutral-500">{status}</p>}

        <button
          onClick={handleGenerate}
          disabled={!file}
          className="mt-6 w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
        >
          Generate flashcards
        </button>
      </div>
    </div>
  );
}

type ReviewScreenProps = {
  setCreateStep: (step: "setup" | "review") => void;
  handleSaveDeck: () => void;
  cards: Card[];
  selectedCardIndex: number;
  setSelectedCardIndex: (index: number) => void;
  addCard: () => void;
  deleteCard: (index: number) => void;
  updateCard: (index: number, field: "front" | "back", value: string) => void;
};

function ReviewScreen({
  setCreateStep,
  handleSaveDeck,
  cards,
  selectedCardIndex,
  setSelectedCardIndex,
  addCard,
  deleteCard,
  updateCard,
}: ReviewScreenProps) {
  const safeCards = Array.isArray(cards) ? cards : [];
  const card = safeCards[selectedCardIndex];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Edit, add, or delete cards before creating your deck</p>
        </div>
        <button
          onClick={handleSaveDeck}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Save deck
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-72 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">Cards ({safeCards.length})</span>
            <button onClick={addCard} className="text-sm text-neutral-500 hover:text-neutral-800">
              + Add card
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-neutral-200 bg-white">
            {safeCards.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedCardIndex(i)}
                className={`flex w-full items-start gap-2 border-b border-neutral-100 px-3 py-2.5 text-left text-sm last:border-b-0 ${
                  i === selectedCardIndex ? "bg-neutral-100" : "hover:bg-neutral-50"
                }`}
              >
                <span className="text-neutral-400">{i + 1}</span>
                <span className="line-clamp-2 text-neutral-800">
                  <LatexRenderer content={c.front || "(empty)"} />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main: Notion-style editor */}
        {card && (
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between text-sm text-neutral-500">
              <span>{selectedCardIndex + 1} / {safeCards.length}</span>
              <button onClick={() => deleteCard(selectedCardIndex)} className="text-red-600 hover:text-red-700">
                Delete card
              </button>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <label className="mb-2 block text-xs font-medium uppercase text-neutral-400">Front</label>
              <MathField
                value={card.front}
                onChange={(val) => updateCard(selectedCardIndex, "front", val)}
              />
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <label className="mb-2 block text-xs font-medium uppercase text-neutral-400">Back</label>
              <MathField
                value={card.back}
                onChange={(val) => updateCard(selectedCardIndex, "back", val)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type StudyScreenProps = {
  deck: { id: number; name: string; folder_id: number | null; cards: Card[] };
  folders: Folder[];
  onExit: () => void;
  onBrowse: (focusIndex?: number) => void;
  onSaveCard: (index: number, front: string, back: string) => void;
};

function StudyScreen({ deck, folders, onExit, onBrowse, onSaveCard }: StudyScreenProps) {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [editingInline, setEditingInline] = useState(false);

  const total = deck.cards.length;
  const card = deck.cards[index];
  const done = index >= total;
  const progressPercent = total === 0 ? 0 : Math.round((index / total) * 100);
  const folderName = folders.find((f) => f.id === deck.folder_id)?.name;

  function reveal() {
    setShowAnswer(true);
  }

  function next() {
    setShowAnswer(false);
    setIndex((i) => i + 1);
  }

  function restart() {
    setShowAnswer(false);
    setIndex(0);
  }

  function prev() {
  setShowAnswer(false);
  setIndex((i) => Math.max(0, i - 1));
  }

  // keyboard: space to reveal, enter/right arrow to advance once revealed
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (done) return;
      if (e.code === "Space") {
        e.preventDefault();
        showAnswer ? next() : reveal();
      } else if ((e.code === "Enter" || e.code === "ArrowRight") && showAnswer) {
        next();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showAnswer, done]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* header: exit, breadcrumb, progress */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-2">
        <button onClick={onExit} className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900">
          <Image src="/back.png" alt="" width={16} height={16} />
          Back
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => onBrowse()} className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700">
            <Image src="/browse.png" alt="" width={16} height={16} />
            Browse
          </button>
          <button onClick={() => setEditingInline(true)} className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700">
            <Image src="/pencil.png" alt="" width={16} height={16} />
            Edit Card
          </button>
          <button onClick={() => alert("Stats - coming soon, once spaced repetition is added")} className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700">
            <Image src="/stats.png" alt="" width={16} height={16} />
            Stats
          </button>
        </div>
      </div>
      <div className="mb-6">
        <p className="mb-2 text-xs text-neutral-400">
          {folderName ? `${folderName} / ` : ""}{deck.name}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all"
            style={{ width: `${done ? 100 : progressPercent}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={index === 0}
            className="text-xs text-neutral-400 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ← Previous card
          </button>
          <p className="text-xs text-neutral-400">
            {done ? total : index + 1} / {total}
          </p>
        </div>
      </div>

      {done ? (
        // completion screen
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
          <p className="mb-1 text-lg font-medium text-neutral-900">Nice work!</p>
          <p className="mb-6 text-sm text-neutral-500">You reviewed all {total} cards.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={restart}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Study again
            </button>
            <button
              onClick={onExit}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
            >
              Back to decks
            </button>
          </div>
        </div>
      ) : editingInline ? (
        <InlineCardEditor
          front={card.front}
          back={card.back}
          onSave={(f, b) => {
            onSaveCard(index, f, b);
            setEditingInline(false);
          }}
          onCancel={() => setEditingInline(false)}
        />
      ) : (
        // the card itself - no flip, front always visible, back reveals below
        <CardDeckVisual
          front={card.front}
          back={card.back}
          showAnswer={showAnswer}
          onReveal={() => (showAnswer ? next() : reveal())}
        />
      )}
      </div>
  );
}

function InlineCardEditor({
  front,
  back,
  onSave,
  onCancel,
}: {
  front: string;
  back: string;
  onSave: (front: string, back: string) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState(front);
  const [b, setB] = useState(back);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-2xl">
      <label className="mb-2 block text-xs font-medium uppercase text-neutral-400">Front</label>
        <div className="mb-6">
          <MathField value={f} onChange={setF} />
        </div>
        <label className="mb-2 block text-xs font-medium uppercase text-neutral-400">Back</label>
        <div className="mb-6">
          <MathField value={b} onChange={setB} />
        </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700">
          Cancel
        </button>
        <button onClick={() => onSave(f, b)} className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm text-white hover:bg-neutral-800">
          Save
        </button>
      </div>
    </div>
  );
}

/* 
  export default
 */

export default function FlashcardsPage() {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [contextMenu, setContextMenu] = useState<{ folderId: number; x: number; y: number } | null>(null);
    const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [view, setView] = useState<"menu" | "create" | "study" | "browse">("menu");
    const [editingDeckId, setEditingDeckId] = useState<number | null>(null);
    const [studyDeck, setStudyDeck] = useState<{ id: number; name: string; folder_id: number | null; cards: Card[] } | null>(null);
    const [createStep, setCreateStep] = useState<"setup" | "review">("setup");
    const [file, setFile] = useState<File | null>(null);
    const [depth, setDepth] = useState<"concise" | "standard">("standard");
    const [createFolderId, setCreateFolderId] = useState<number | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [selectedCardIndex, setSelectedCardIndex] = useState(0);
    const [expandedFolders, setExpandedFolders] = useState<number[]>([]);
    const [decks, setDecks] = useState<Record<number, Deck[]>>({});
    const [newFolderName, setNewFolderName] = useState(""); 
    const [deckName, setDeckName] = useState("");
    const [status, setStatus] = useState(""); 

    useEffect(() => {
        loadFolders();
    }, []);

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

    async function toogleFolders(folderId: number) {
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

            const data = await res.json();

            setDecks({
                ...decks,
                [folderId]: data,
            });

            setExpandedFolders([
                ...expandedFolders,
                folderId, 
            ]);
        } catch (error) {
            console.error("Error loading decks:", error);
            setStatus("Failed to load decks");
        }
    } 
        
    async function handleCreateFolder() {
        if (!newFolderName.trim()) return; 

        try {
            const res = await fetch(
                `${API}/folders?name=${encodeURIComponent(newFolderName)}`,
                { method: "POST"}
            );
            if (!res.ok) throw new Error(`Failed to create folder: ${res.status}`);
            await res.json();

            await loadFolders();                    
            setNewFolderName("");                   
        } catch (error) {
            console.error("Error creating folder:", error);
            setStatus("Failed to create folder");
        }
    }

    function openContextMenu(e: React.MouseEvent, folderId: number) {
        e.preventDefault();
        setContextMenu({ folderId, x: e.clientX, y: e.clientY });
    }

    async function handleRenameFolder(folderId: number) {
      if (!renameValue.trim()) return;
      try {
          await fetch(`${API}/folders/${folderId}?name=${encodeURIComponent(renameValue)}`, {
            method: "PATCH",
          });
          await loadFolders();
          setRenamingFolderId(null);
      } catch (error) {
          console.error("Error renaming folder:", error);
          setStatus("Failed to rename folder");
      }
    }

    async function handleDeleteFolder(folderId: number) {
      if (!confirm("Delete this folder and everything in it?")) return;
      try {
          await fetch(`${API}/folders/${folderId}`, { method: "DELETE" });
          await loadFolders();
      } catch (error) {
          console.error("Error deleting folder:", error);
          setStatus("Failed to delete folder");
      }
    }

    function openCreateFlow() {
      setFile(null);
      setDeckName("");
      setDepth("standard");
      setCreateFolderId(null);
      setCards([]);
      setCreateStep("setup");
      setView("create");
    }

    async function saveInlineCardEdit(index: number, front: string, back: string) {
      if (!studyDeck) return;
      const updatedCards = [...studyDeck.cards];
      updatedCards[index] = { front, back };

      try {
        const res = await fetch(`${API}/decks/${studyDeck.id}/cards`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCards),
        });
        if (!res.ok) throw new Error(`Failed to update card: ${res.status}`);
        setStudyDeck({ ...studyDeck, cards: updatedCards });
        setStatus("Card updated!");
      } catch (error) {
        console.error("Error updating card:", error);
        setStatus("Failed to update card");
      }
    }

    async function handleGenerate() {
      if (!file) return;
      setStatus("Generating flashcards... this can take a while.");

      const name = deckName || file.name.replace(/\.pdf$/i, "");
      const form = new FormData();
      form.append("file", file);

      try {
        const folderParam = createFolderId ? `&folder_id=${createFolderId}` : "";
        const url = `${API}/generate?name=${encodeURIComponent(name)}&depth=${depth}${folderParam}`;
        const res = await fetch(url, { method: "POST", body: form });
        if (!res.ok) throw new Error(`Failed to generate cards: ${res.status}`);
        const data = await res.json();

        setDeckName(name);
        const cardArray = data.cards || data;
        setCards(Array.isArray(cardArray) ? cardArray : []);
        setSelectedCardIndex(0);
        setCreateStep("review");
        setStatus("");
      } catch (error) {
        console.error("Error generating cards:", error);
        setStatus("Failed to generate cards from PDF");
      }
    }

    function openBrowse(focusIndex = 0) {
      if (!studyDeck) return;
      setCards(studyDeck.cards);
      setSelectedCardIndex(focusIndex);
      setEditingDeckId(studyDeck.id);
      setView("browse");
    }

    function updateCard(index: number, field: "front" | "back", value: string) {
      const next = [...cards];
      next[index] = { ...next[index], [field]: value };
      setCards(next);
    }

    function deleteCard(index: number) {
      const next = cards.filter((_, i) => i !== index);
      setCards(next);
      setSelectedCardIndex(Math.min(selectedCardIndex, next.length - 1));
    }

    function addCard() {
      const next = [...cards, { front: "", back: "" }];
      setCards(next);
      setSelectedCardIndex(next.length - 1);
    }

    async function handleSaveDeck() {
      setStatus("Saving...");
      try {
        if (editingDeckId) {
          // uppdates a saved deck (browse)
          const res = await fetch(`${API}/decks/${editingDeckId}/cards`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cards),
          });
          if (!res.ok) throw new Error(`Failed to update deck: ${res.status}`);

          setStudyDeck({ ...studyDeck!, cards });
          setEditingDeckId(null);
          setView("study");
        } else {
          // new deck
          const folderParam = createFolderId ? `&folder_id=${createFolderId}` : "";
          const url = `${API}/decks?name=${encodeURIComponent(deckName)}${folderParam}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cards),
          });
          if (!res.ok) throw new Error(`Failed to save deck: ${res.status}`);
          await loadFolders();
          setView("menu");
        }
        setStatus("Saved!");
      } catch (error) {
        console.error("Error saving:", error);
        setStatus("Failed to save");
      }
    }

    async function startStudying(deckId: number) {
      try {
        const res = await fetch(`${API}/decks/${deckId}`);
        if (!res.ok) throw new Error(`Failed to fetch deck: ${res.status}`);
        const data = await res.json();
        setStudyDeck(data);
        setView("study");
      } catch (error) {
        console.error("Error loading deck:", error);
        setStatus("Failed to load deck");
      }
    }

    return ( 
    <main className="min-h-screen bg-neutral-50 px-10 py-8">
      {view === "menu" ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-neutral-900">All Decks</h1>
            <button
              onClick={openCreateFlow}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              + New deck
            </button>
          </div>

          <div className="mb-6 flex gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleCreateFolder}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Add folder
            </button>
          </div>

          {status && <p className="mb-4 text-sm text-neutral-500">{status}</p>}

          <div className="rounded-lg border border-neutral-200 bg-white">
            {folders.length === 0 ? (
              <p className="p-4 text-sm text-neutral-500">No folders yet.</p>
            ) : (
              folders.map((folder, index) => {
                const isExpanded = expandedFolders.includes(folder.id);
                const folderDecks = decks[folder.id] || [];

                return (
                  <div
                    key={folder.id}
                    className={index !== 0 ? "border-t border-neutral-200" : ""}
                  >
                    <div
                        onClick={() => toogleFolders(folder.id)}
                        onContextMenu={(e) => openContextMenu(e, folder.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
                    >
                        <span className="flex items-center gap-2">
                            <span className="w-3 text-xs text-neutral-400">
                            {isExpanded ? "▼" : "▶"}
                            </span>
                            <Image
                            src="/burgundy_folder_icon.jpg"
                            alt=""
                            width={18}
                            height={18}
                            />
                            {renamingFolderId === folder.id ? (
                            <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameFolder(folder.id);
                                if (e.key === "Escape") setRenamingFolderId(null);
                                }}
                                onBlur={() => setRenamingFolderId(null)}
                                className="rounded border border-neutral-300 px-1 text-sm"
                            />
                            ) : (
                            <span className="text-sm font-medium text-neutral-900">
                                {folder.name}
                            </span>
                            )}
                        </span>
                        <span className="text-xs text-neutral-400">
                            {folderDecks.length}{" "}
                            {folderDecks.length === 1 ? "deck" : "decks"}
                        </span>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-neutral-100 bg-neutral-50/50">
                        {folderDecks.length === 0 ? (
                          <p className="px-12 py-3 text-sm text-neutral-400">
                            No decks in this folder yet.
                          </p>
                        ) : (
                          folderDecks.map((deck) => (
                            <div
                              key={deck.id}
                              onClick={() => startStudying(deck.id)}
                              className="group flex cursor-pointer items-center justify-between px-12 py-2.5 text-sm hover:bg-neutral-100"
                            >
                              <span className="text-neutral-800">{deck.name}</span>
                              <span className="flex items-center gap-3">
                                <span className="text-xs text-neutral-400">
                                  {deck.card_count}{" "}
                                  {deck.card_count === 1 ? "card" : "cards"}
                                </span>
                                <span className="text-xs font-medium text-neutral-900 opacity-0 transition-opacity group-hover:opacity-100">
                                  Study →
                                </span>
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {contextMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setContextMenu(null)}
              />
              <div
                className="fixed z-20 w-32 rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
                style={{ top: contextMenu.y, left: contextMenu.x }}
              >
                <button
                    onClick={() => {
                    setRenamingFolderId(contextMenu.folderId);
                    const folder = folders.find((f) => f.id === contextMenu.folderId);
                    setRenameValue(folder?.name || "");
                    setContextMenu(null);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                    Rename
                </button>
                <button
                    onClick={() => {
                    handleDeleteFolder(contextMenu.folderId);
                    setContextMenu(null);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-neutral-50"
                >
                    Delete
                </button>
              </div>
            </>
          )}
        </>
      ) : view === "create" ? (
        createStep === "setup" ? (
          <SetupScreen 
            setView={setView}
            file={file}
            setFile={setFile}
            depth={depth}
            setDepth={setDepth}
            deckName={deckName}
            setDeckName={setDeckName}
            createFolderId={createFolderId}
            setCreateFolderId={setCreateFolderId}
            folders={folders}
            status={status}
            handleGenerate={handleGenerate}
          />
        ) : (
          <ReviewScreen 
            setCreateStep={setCreateStep}
            handleSaveDeck={handleSaveDeck}
            cards={cards}
            selectedCardIndex={selectedCardIndex}
            setSelectedCardIndex={setSelectedCardIndex}
            addCard={addCard}
            deleteCard={deleteCard}
            updateCard={updateCard}
          />
        )
      ) : view === "browse" ? (
        <ReviewScreen 
          setCreateStep={() => setView("study")}
          handleSaveDeck={handleSaveDeck}
          cards={cards}
          selectedCardIndex={selectedCardIndex}
          setSelectedCardIndex={setSelectedCardIndex}
          addCard={addCard}
          deleteCard={deleteCard}
          updateCard={updateCard}
        />
      ) : view === "study" && studyDeck ? (
        <StudyScreen
          deck={studyDeck}
          folders={folders}
          onExit={() => setView("menu")}
          onBrowse={openBrowse}
          onSaveCard={saveInlineCardEdit}
        />
      ) : null}
    </main>
  );
}
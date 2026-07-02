import { useEffect, useState } from 'react';
import { ParagraphBlock, ListBlock } from './Blocks';

let blockCounter = 0;
function newId() {
  blockCounter += 1;
  return `b${Date.now()}${blockCounter}`;
}

export default function NoteEditor({ note, index, onSave, onDelete, saving }) {
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([]);

  // Reset local editing state whenever the selected note changes.
  useEffect(() => {
    if (!note) return;
    setTitle(note.title || '');
    setBlocks(
      note.blocks?.length
        ? note.blocks.map((b) => ({ ...b, id: b.id || newId() }))
        : [{ id: newId(), type: 'paragraph', text: '' }]
    );
  }, [note?.id]);

  if (!note) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-white/30">
          No entry selected
        </p>
        <p className="mt-2 max-w-xs text-sm text-white/50">
          Pick a note from the list, or start a new one.
        </p>
      </div>
    );
  }

  function updateBlock(i, updated) {
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? updated : b)));
  }

  function removeBlock(i) {
    setBlocks((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length ? next : [{ id: newId(), type: 'paragraph', text: '' }];
    });
  }

  function addBlock(type) {
    setBlocks((prev) => [
      ...prev,
      type === 'list'
        ? { id: newId(), type: 'list', items: [''] }
        : { id: newId(), type: 'paragraph', text: '' },
    ]);
  }

  function handleSave() {
    onSave({ ...note, title: title.trim() || 'Untitled', blocks });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-xs tracking-[0.3em] text-accent">
          N° {String((index ?? 0) + 1).padStart(3, '0')}
        </p>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="font-mono text-xs uppercase tracking-widest text-white/40 hover:text-accent"
        >
          Delete
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled note"
        className="mb-6 w-full border-b border-border bg-transparent pb-3 font-display text-2xl font-bold text-white outline-none focus:border-accent"
      />

      <div className="flex-1 overflow-y-auto pr-1">
        {blocks.map((block, i) =>
          block.type === 'list' ? (
            <ListBlock
              key={block.id}
              block={block}
              onChange={(updated) => updateBlock(i, updated)}
              onRemove={() => removeBlock(i)}
            />
          ) : (
            <ParagraphBlock
              key={block.id}
              block={block}
              onChange={(updated) => updateBlock(i, updated)}
              onRemove={() => removeBlock(i)}
            />
          )
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => addBlock('paragraph')}
            className="rounded-md border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-white/60 hover:border-accent hover:text-accent"
          >
            + Paragraph
          </button>
          <button
            type="button"
            onClick={() => addBlock('list')}
            className="rounded-md border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-white/60 hover:border-accent hover:text-accent"
          >
            + List
          </button>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-md bg-accent py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save entry'}
        </button>
      </div>
    </div>
  );
}

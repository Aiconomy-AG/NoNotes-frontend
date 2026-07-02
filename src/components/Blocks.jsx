export function ParagraphBlock({ block, onChange, onRemove }) {
  return (
    <div className="group relative mb-4">
      <textarea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Write a paragraph…"
        rows={3}
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2.5 leading-relaxed text-white/90 outline-none transition-colors focus:border-accent"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove paragraph"
        className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-white/50 hover:border-accent hover:text-accent group-hover:flex"
      >
        ×
      </button>
    </div>
  );
}

export function ListBlock({ block, onChange, onRemove }) {
  function updateItem(index, value) {
    const items = [...block.items];
    items[index] = value;
    onChange({ ...block, items });
  }

  function addItem() {
    onChange({ ...block, items: [...block.items, ''] });
  }

  function removeItem(index) {
    const items = block.items.filter((_, i) => i !== index);
    onChange({ ...block, items: items.length ? items : [''] });
  }

  return (
    <div className="group relative mb-4 rounded-md border border-border bg-background p-3">
      <ul className="space-y-2">
        {block.items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-accent" aria-hidden="true">•</span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder="List item"
              className="w-full bg-transparent text-white/90 outline-none"
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              aria-label="Remove item"
              className="text-white/30 hover:text-accent"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={addItem}
        className="mt-3 font-mono text-xs uppercase tracking-widest text-white/40 hover:text-accent"
      >
        + Add item
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove list"
        className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-white/50 hover:border-accent hover:text-accent group-hover:flex"
      >
        ×
      </button>
    </div>
  );
}

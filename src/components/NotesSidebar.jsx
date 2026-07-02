export default function NotesSidebar({
  notes,
  selectedId,
  onSelect,
  onCreate,
  user,
  onLogout,
  searchTerm,
  onSearchTermChange,
}) {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-accent">NOTES</p>
          <p className="font-display text-lg font-bold text-white">My Notebook</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          aria-label="New note"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-white/70 hover:border-accent hover:text-accent"
        >
          +
        </button>
      </div>

      <div className="border-b border-border px-5 py-4">
        <label className="sr-only" htmlFor="note-search">
          Search notes by title
        </label>
        <input
          id="note-search"
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          placeholder="Search titles"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-accent"
        />
      </div>

      <ul className="flex-1 overflow-y-auto py-2">
        {notes.length === 0 && (
          <li className="px-5 py-6 text-center font-mono text-xs uppercase tracking-widest text-white/30">
            {searchTerm ? 'No matches' : 'No entries yet'}
          </li>
        )}
        {notes.map((note, index) => {
          const active = note.id === selectedId;
          return (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => onSelect(note.id)}
                className={`flex w-full items-center gap-3 border-l-2 px-5 py-3 text-left transition-colors ${
                  active ? 'border-accent bg-background' : 'border-transparent hover:bg-background/50'
                }`}
              >
                <span className="font-mono text-[11px] text-white/30">
                  {String(index + 1).padStart(3, '0')}
                </span>
                <span className={`truncate text-sm ${active ? 'text-white' : 'text-white/70'}`}>
                  {note.title || 'Untitled'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border px-5 py-4">
        <p className="truncate font-mono text-xs text-white/40">
          {user?.username || user?.name}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 font-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

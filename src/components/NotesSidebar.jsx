import { ChevronDown, FileText, Folder, FolderPlus, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

function buildFolderTree(folders) {
  const nodes = folders.map((folder) => ({ ...folder, children: [] }));
  const byId = new Map(nodes.map((folder) => [folder.id, folder]));
  const roots = [];

  nodes.forEach((folder) => {
    const parent = folder.parent_id ? byId.get(folder.parent_id) : null;
    if (parent) parent.children.push(folder);
    else roots.push(folder);
  });

  const sortTree = (items) => {
    items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
    items.forEach((item) => sortTree(item.children));
  };
  sortTree(roots);

  return roots;
}

function hasDescendant(folder, targetId) {
  return folder.children.some((child) => child.id === targetId || hasDescendant(child, targetId));
}

function findFolderNode(tree, id) {
  for (const folder of tree) {
    if (folder.id === id) return folder;
    const found = findFolderNode(folder.children, id);
    if (found) return found;
  }
  return null;
}

export default function NotesSidebar({
  notes,
  folders,
  selectedId,
  onSelect,
  onCreate,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveNote,
  onMoveFolder,
  user,
  onLogout,
  searchTerm,
  onSearchTermChange,
}) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [dragOverId, setDragOverId] = useState('root');
  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);
  const notesByFolder = useMemo(() => {
    const grouped = new Map();
    notes.forEach((note) => {
      const key = note.folder_id ?? 'root';
      grouped.set(key, [...(grouped.get(key) ?? []), note]);
    });
    return grouped;
  }, [notes]);

  function toggleExpanded(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function readDrag(event) {
    const raw = event.dataTransfer.getData('application/json');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function startDrag(event, payload) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
  }

  function canDrop(payload, targetFolder) {
    if (!payload) return false;
    if (payload.type === 'note') return true;
    if (payload.type !== 'folder') return false;
    if (!targetFolder) return true;
    if (payload.id === targetFolder.id) return false;
    const dragged = findFolderNode(folderTree, payload.id);
    return dragged ? !hasDescendant(dragged, targetFolder.id) : true;
  }

  function handleDrop(event, targetFolder = null) {
    event.preventDefault();
    event.stopPropagation();
    const payload = readDrag(event);
    if (!canDrop(payload, targetFolder)) return;
    const targetId = targetFolder?.id ?? null;
    if (payload.type === 'note') onMoveNote(payload.id, targetId);
    if (payload.type === 'folder') onMoveFolder(payload.id, targetId);
    if (targetFolder) {
      setExpanded((prev) => new Set(prev).add(targetFolder.id));
    }
    setDragOverId(null);
  }

  function renderNotes(folderId, depth) {
    const folderNotes = notesByFolder.get(folderId ?? 'root') ?? [];
    return folderNotes.map((note) => {
      const active = note.id === selectedId;
      return (
        <li key={`note-${note.id}`}>
          <button
            type="button"
            draggable
            onDragStart={(event) => startDrag(event, { type: 'note', id: note.id })}
            onClick={() => onSelect(note.id)}
            className={`flex h-9 w-full items-center gap-2 border-l-2 pr-3 text-left text-sm transition-colors ${
              active ? 'border-accent bg-background text-white' : 'border-transparent text-white/70 hover:bg-background/50'
            }`}
            style={{ paddingLeft: `${20 + depth * 16}px` }}
          >
            <FileText className="h-4 w-4 shrink-0 text-white/35" />
            <span className="truncate">{note.title || 'Untitled'}</span>
          </button>
        </li>
      );
    });
  }

  function renderFolder(folder, depth = 0) {
    const isExpanded = expanded.has(folder.id) || Boolean(searchTerm);
    const dropActive = dragOverId === `folder-${folder.id}`;

    return (
      <li key={`folder-${folder.id}`}>
        <div
          draggable
          onDragStart={(event) => startDrag(event, { type: 'folder', id: folder.id })}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragOverId(`folder-${folder.id}`);
          }}
          onDragLeave={(event) => {
            event.stopPropagation();
            setDragOverId(null);
          }}
          onDrop={(event) => handleDrop(event, folder)}
          className={`group flex h-10 items-center gap-2 pr-2 text-sm transition-colors ${
            dropActive ? 'bg-accent/15 text-white' : 'text-white/80 hover:bg-background/50'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <button
            type="button"
            onClick={() => toggleExpanded(folder.id)}
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            className="flex h-6 w-6 items-center justify-center rounded text-white/45 hover:text-white"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
          </button>
          <Folder className="h-4 w-4 shrink-0 text-accent" />
          <button type="button" onClick={() => toggleExpanded(folder.id)} className="min-w-0 flex-1 truncate text-left">
            {folder.name}
          </button>
          <button
            type="button"
            onClick={() => onCreate(folder.id)}
            aria-label={`Create note in ${folder.name}`}
            className="hidden h-7 w-7 items-center justify-center rounded text-white/40 hover:bg-background hover:text-accent group-hover:flex"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onCreateFolder(folder.id)}
            aria-label={`Create folder in ${folder.name}`}
            className="hidden h-7 w-7 items-center justify-center rounded text-white/40 hover:bg-background hover:text-accent group-hover:flex"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRenameFolder(folder)}
            aria-label={`Rename ${folder.name}`}
            className="hidden h-7 w-7 items-center justify-center rounded text-white/40 hover:bg-background hover:text-accent group-hover:flex"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteFolder(folder)}
            aria-label={`Delete ${folder.name}`}
            className="hidden h-7 w-7 items-center justify-center rounded text-white/40 hover:bg-background hover:text-accent group-hover:flex"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {isExpanded && (
          <ul>
            {folder.children.map((child) => renderFolder(child, depth + 1))}
            {renderNotes(folder.id, depth + 1)}
          </ul>
        )}
      </li>
    );
  }

  const empty = notes.length === 0 && folders.length === 0;

  return (
    <aside className="flex h-full w-80 flex-col border-r border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.3em] text-accent">NOTES</p>
          <p className="truncate font-display text-lg font-bold text-white">My Notebook</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onCreateFolder(null)}
            aria-label="New folder"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-white/70 hover:border-accent hover:text-accent"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onCreate(null)}
            aria-label="New note"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-white/70 hover:border-accent hover:text-accent"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
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

      <div
        className={`flex-1 overflow-y-auto py-2 ${dragOverId === 'root' ? 'bg-background/30' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOverId('root');
        }}
        onDragLeave={() => setDragOverId(null)}
        onDrop={(event) => handleDrop(event, null)}
      >
        {empty && (
          <p className="px-5 py-6 text-center font-mono text-xs uppercase tracking-widest text-white/30">
            {searchTerm ? 'No matches' : 'No entries yet'}
          </p>
        )}
        <ul>
          {folderTree.map((folder) => renderFolder(folder))}
          {renderNotes(null, 0)}
        </ul>
      </div>

      <div className="border-t border-border px-5 py-4">
        <p className="truncate font-mono text-xs text-white/40">{user?.username || user?.name}</p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

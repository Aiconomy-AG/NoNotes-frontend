import { useEffect, useState } from 'react';
import api from '../Api';
import { useAuth } from '../context/AuthContext';
import NotesSidebar from '../components/NotesSidebar';
import NoteEditor from '../components/NoteEditor';

export default function NotesPage() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/api/notes'), api.get('/api/folders')])
      .then(([notesRes, foldersRes]) => {
        if (cancelled) return;
        // Handles both a plain array and a Laravel API Resource collection ({ data: [...] }).
        const data = Array.isArray(notesRes.data) ? notesRes.data : notesRes.data.data;
        const folderData = Array.isArray(foldersRes.data) ? foldersRes.data : foldersRes.data.data;
        setNotes(data);
        setFolders(folderData);
        setSelectedId(data?.[0]?.id ?? null);
      })
      .catch(() => setError('Could not load notes.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const selectedIndex = notes.findIndex((n) => n.id === selectedId);
  const selectedNote = selectedIndex >= 0 ? notes[selectedIndex] : null;
  const filteredNotes = notes.filter((note) => {
    const title = note.title || 'Untitled';
    return title.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  async function handleCreate(folderId = null) {
    const draft = { title: 'Untitled', blocks: [{ type: 'paragraph', text: '' }], folder_id: folderId };
    try {
      const res = await api.post('/api/notes', draft);
      const created = res.data.data || res.data;
      setNotes((prev) => [created, ...prev]);
      setSelectedId(created.id);
    } catch {
      setError('Could not create note.');
    }
  }

  async function handleCreateFolder(parentId = null) {
    const name = window.prompt('Folder name');
    if (name === null) return;
    try {
      const res = await api.post('/api/folders', { name, parent_id: parentId });
      const created = res.data.data || res.data;
      setFolders((prev) => [...prev, created]);
    } catch {
      setError('Could not create folder.');
    }
  }

  async function handleRenameFolder(folder) {
    const name = window.prompt('Folder name', folder.name);
    if (name === null) return;
    try {
      const res = await api.put(`/api/folders/${folder.id}`, { name });
      const saved = res.data.data || res.data;
      setFolders((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
    } catch {
      setError('Could not rename folder.');
    }
  }

  async function handleDeleteFolder(folder) {
    if (!window.confirm(`Delete "${folder.name}"? Notes and subfolders will move to the root.`)) return;
    try {
      await api.delete(`/api/folders/${folder.id}`);
      setFolders((prev) =>
        prev
          .filter((f) => f.id !== folder.id)
          .map((f) => (f.parent_id === folder.id ? { ...f, parent_id: null } : f)),
      );
      setNotes((prev) => prev.map((n) => (n.folder_id === folder.id ? { ...n, folder_id: null } : n)));
    } catch {
      setError('Could not delete folder.');
    }
  }

  async function handleSave(updated) {
    setSaving(true);
    setError('');
    try {
      const res = await api.put(`/api/notes/${updated.id}`, {
        title: updated.title,
        blocks: updated.blocks,
        folder_id: updated.folder_id,
      });
      const saved = res.data.data || res.data;
      setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
    } catch {
      setError('Could not save note.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      await api.delete(`/api/notes/${id}`);
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        setSelectedId(next[0]?.id ?? null);
        return next;
      });
    } catch {
      setError('Could not delete note.');
    }
  }

  async function handleMoveNote(noteId, folderId) {
    const note = notes.find((n) => n.id === noteId);
    if (!note || note.folder_id === folderId) return;

    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, folder_id: folderId } : n)));
    try {
      const res = await api.put(`/api/notes/${noteId}`, { folder_id: folderId });
      const saved = res.data.data || res.data;
      setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
    } catch {
      setError('Could not move note.');
      setNotes((prev) => prev.map((n) => (n.id === noteId ? note : n)));
    }
  }

  async function handleMoveFolder(folderId, parentId) {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder || folder.parent_id === parentId) return;

    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, parent_id: parentId } : f)));
    try {
      const res = await api.put(`/api/folders/${folderId}`, { parent_id: parentId });
      const saved = res.data.data || res.data;
      setFolders((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
    } catch {
      setError('Could not move folder.');
      setFolders((prev) => prev.map((f) => (f.id === folderId ? folder : f)));
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <NotesSidebar
        notes={filteredNotes}
        folders={folders}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveNote={handleMoveNote}
        onMoveFolder={handleMoveFolder}
        user={user}
        onLogout={logout}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      <main className="flex-1 overflow-hidden px-10 py-8">
        {loading ? (
          <p className="font-mono text-xs uppercase tracking-widest text-white/30">Loading…</p>
        ) : (
          <>
            {error && (
              <p role="alert" className="mb-4 border-l-2 border-accent bg-accent/10 px-3 py-2 text-sm text-white/80">
                {error}
              </p>
            )}
            <NoteEditor
              note={selectedNote}
              index={selectedIndex}
              onSave={handleSave}
              onDelete={handleDelete}
              saving={saving}
            />
          </>
        )}
      </main>
    </div>
  );
}

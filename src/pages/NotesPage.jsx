import { useEffect, useState } from 'react';
import api from '../Api';
import { useAuth } from '../context/AuthContext';
import NotesSidebar from '../components/NotesSidebar';
import NoteEditor from '../components/NoteEditor';

export default function NotesPage() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/api/notes')
      .then((res) => {
        if (cancelled) return;
        // Handles both a plain array and a Laravel API Resource collection ({ data: [...] }).
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setNotes(data);
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

  async function handleCreate() {
    const draft = { title: 'Untitled', blocks: [{ type: 'paragraph', text: '' }] };
    try {
      const res = await api.post('/api/notes', draft);
      const created = res.data.data || res.data;
      setNotes((prev) => [created, ...prev]);
      setSelectedId(created.id);
    } catch {
      setError('Could not create note.');
    }
  }

  async function handleSave(updated) {
    setSaving(true);
    setError('');
    try {
      const res = await api.put(`/api/notes/${updated.id}`, {
        title: updated.title,
        blocks: updated.blocks,
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

  return (
    <div className="flex h-screen bg-background">
      <NotesSidebar
        notes={notes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        user={user}
        onLogout={logout}
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

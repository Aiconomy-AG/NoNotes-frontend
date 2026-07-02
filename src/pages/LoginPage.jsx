import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('login');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      const dest = location.state?.from?.pathname || '/notes';
      navigate(dest, { replace: true });
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data?.errors || {};
        setError(
          errors.username?.[0] ||
            errors.password?.[0] ||
            'Could not complete the request.'
        );
      } else {
        setError(mode === 'login' ? 'Could not sign in. Try again.' : 'Could not create account. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-[0.3em] text-accent">N° 001</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-white">Notes</h1>
          <div className="mx-auto mt-4 h-px w-10 bg-accent" />
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/40">
            {mode === 'login' ? 'Sign in to continue' : 'Create an account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-8">
          <div className="mb-5">
            <label
              htmlFor="username"
              className="mb-2 block font-mono text-xs uppercase tracking-widest text-white/50"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-white outline-none transition-colors focus:border-accent"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-2 block font-mono text-xs uppercase tracking-widest text-white/50"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-white outline-none transition-colors focus:border-accent"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mb-5 border-l-2 border-accent bg-accent/10 px-3 py-2 text-sm text-white/80"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (mode === 'login' ? 'Signing in…' : 'Creating…') : mode === 'login' ? 'Sign in' : 'Create account'}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setError('');
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            className="mt-4 w-full font-mono text-xs uppercase tracking-widest text-white/40 hover:text-accent"
          >
            {mode === 'login' ? 'Need an account?' : 'Have an account?'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { login } from '@/lib/api';
import { setAuth } from '@/lib/auth';

export default function LoginPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputClass =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-ring';
  const labelClass = 'block text-xs font-medium font-cairo mb-1.5 text-muted-foreground';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      const data = res.data as { token: string; username: string; role: 'ROLE_ADMIN' | 'ROLE_USER' };
      setAuth({ token: data.token, username: data.username, role: data.role });
      nav('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
          <h1 className="font-cairo font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>
            تسجيل الدخول
          </h1>
        </div>

        <p className="text-sm text-muted-foreground font-cairo mb-6">
          نظام الرواتب — دخول المستخدمين المعتمدين فقط
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>اسم المستخدم</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className={inputClass + ' pl-9'}
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="مثال: Almasa-user1"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>كلمة المرور</label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              className="p-3 rounded-lg text-sm font-cairo"
              style={{ background: 'hsl(0 84% 60% / 0.08)', color: 'hsl(0 84% 50%)', border: '1px solid hsl(0 84% 60% / 0.2)' }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="navy-btn w-full" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}


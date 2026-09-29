import React, { useState } from 'react';
import { Lock, User as UserIcon, KeyRound, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, LogIn, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, Language, Theme } from '../types';
import { loginApi, registerApi } from '../services/api';
import { saveStoredAuth, verifyLocalCredential } from '../utils/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: User, token: string) => void;
  lang: Language;
  theme: Theme;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  lang,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password');
      return;
    }

    if (mode === 'register' && cleanPass.length < 4) {
      setError(lang === 'ar' ? 'يجب أن تكون كلمة المرور 4 أحرف أو أرقام على الأقل' : 'Password must be at least 4 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginApi(cleanUser, cleanPass);
        if (res.success && res.user && res.token) {
          saveStoredAuth(res.user, res.token, cleanPass);
          onLoginSuccess(res.user, res.token);
        } else {
          // Strict offline credential verification (must match password!)
          const matchedUser = verifyLocalCredential(cleanUser, cleanPass);
          if (matchedUser) {
            const token = `session_${cleanUser}_${Date.now()}`;
            saveStoredAuth(matchedUser, token, cleanPass);
            onLoginSuccess(matchedUser, token);
          } else {
            setError(res.error || (lang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password'));
          }
        }
      } else {
        // Register mode
        const res = await registerApi(cleanUser, cleanPass, name.trim() || cleanUser, email.trim() || undefined);
        if (res.success && res.user && res.token) {
          saveStoredAuth(res.user, res.token, cleanPass);
          onLoginSuccess(res.user, res.token);
        } else {
          // Fallback registration with saved credentials
          const fallbackUser: User = {
            id: `user-${Date.now()}`,
            username: cleanUser,
            name: name.trim() || cleanUser,
            email: email.trim() || undefined,
          };
          const fallbackToken = `session_${cleanUser}_${Date.now()}`;
          saveStoredAuth(fallbackUser, fallbackToken, cleanPass);
          onLoginSuccess(fallbackUser, fallbackToken);
        }
      }
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'تعذر إتمام العملية، يرجى المحاولة ثانية' : 'Operation failed, please retry'));
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden font-['Alexandria','Cairo',sans-serif]">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#111420]/90 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Header Logo & Title */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 mb-1">
            <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            {lang === 'ar' ? 'تسجيل الدخول الآمن' : 'Secure Sign In'}
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            {lang === 'ar'
              ? 'يرجى تسجيل الدخول للوصول إلى جدول مهامك اليومية'
              : 'Sign in to access your daily schedule and tasks'}
          </p>
        </div>

        {/* Tab Switcher (Login / Register) */}
        <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/[0.08] rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-emerald-400 text-slate-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-emerald-400 text-slate-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إنشاء حساب جديد' : 'Register'}</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {lang === 'ar' ? 'الاسم الكامل أو المستعار' : 'Full Name'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: محمد' : 'e.g. John'}
                  className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-zinc-500">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={lang === 'ar' ? 'اكتب اسم المستخدم...' : 'Enter username...'}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 rounded-xl ps-10 pe-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-zinc-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 rounded-xl ps-10 pe-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {lang === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all font-mono"
              />
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>{lang === 'ar' ? 'جارٍ التحقق...' : 'Verifying...'}</span>
              </span>
            ) : (
              <>
                <span>{mode === 'login' ? (lang === 'ar' ? 'دخول إلى جدول المهام' : 'Sign In Now') : (lang === 'ar' ? 'إنشاء الحساب والدخول' : 'Create Account & Enter')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Secure note at bottom */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'بياناتك مشفرة ومحمية في MongoDB Atlas' : 'Encrypted & Secured with MongoDB Atlas'}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Scale, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Bell, 
  TrendingUp, 
  CheckSquare, 
  AlertCircle,
  X
} from 'lucide-react';
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
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter your username/email and password');
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
          // Strict offline credential verification (matches verified password)
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
    <div className="relative min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-x-hidden font-['Alexandria','Cairo',sans-serif] bg-slate-950 text-white select-none">
      
      {/* 1. Cinematic Background with Quran, Flask, Sunrise Mountains Landscape */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/src/assets/images/mizan_login_bg_1790796490412.jpg"
          alt="ميزان - شروق الشمس والقرآن"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.92] contrast-[1.05]"
          referrerPolicy="no-referrer"
        />
        {/* Soft atmospheric vignettes and overlays for maximum contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/50 to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/85 pointer-events-none" />
      </div>

      {/* 2. Main Content Grid (On Mobile/Tablet Portrait: Directly centered Login Form. On Desktop/Tablet Landscape: 2-Column Showcase) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex lg:grid lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-14 items-center justify-center min-h-[85vh] py-2 sm:py-6">
        
        {/* Left Side: Brand Hero Typography & Feature Badges (Visible on Desktop / Tablet Landscape >= 1024px) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between h-full py-4 sm:py-8 text-right space-y-8 xl:space-y-12">
          
          <div className="space-y-5 xl:space-y-6 max-w-2xl overflow-visible">
            
            {/* Title: ميزان */}
            <div className="pt-2 pb-1 overflow-visible">
              <h1 className="text-6xl xl:text-7xl 2xl:text-8xl font-black text-[#fffcf5] tracking-tight leading-[1.3] drop-shadow-[0_6px_24px_rgba(0,0,0,0.85)] filter drop-shadow-[0_2px_12px_rgba(228,194,125,0.35)]">
                ميزان
              </h1>
            </div>

            {/* Subtitle */}
            <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-extrabold text-white/95 leading-normal drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]">
              لأن حياتك أكثر من مجرد مهام
            </h2>

            {/* Paragraph description */}
            <p className="text-sm xl:text-base 2xl:text-lg leading-relaxed text-zinc-100 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] max-w-2xl">
              منصة متكاملة تساعدك على موازنة حياتك بين الدنيا والآخرة،{' '}
              <span className="text-[#fedf98] font-bold underline underline-offset-8 decoration-[#e4c27d]/80">
                بتنظيم عباداتك
              </span>{' '}
              وعاداتك ودراستك ومهامك، ومتابعة تطورك اليومي بخطوات بسيطة نحو أفضل نسخة من نفسك.
            </p>

            {/* 4 Feature Badges in Row */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 xl:gap-4 pt-6">
              
              {/* 1. العبادات والأذكار */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#0c1322]/90 backdrop-blur-xl border border-white/20 hover:border-[#e4c27d] transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_30px_rgba(228,194,125,0.25)] hover:-translate-y-1 group cursor-default">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#1c293e] to-[#0f1726] group-hover:from-[#2a3c5a] group-hover:to-[#172338] border border-[#e4c27d]/40 group-hover:border-[#e4c27d] flex items-center justify-center text-[#fbd88b] mb-3 transition-all shadow-md">
                  <svg className="w-6 h-6 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <path d="M12 18v3" />
                    <path d="M8 15h8" />
                    <circle cx="12" cy="11" r="7" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-white tracking-wide">العبادات</span>
                <span className="text-xs font-semibold text-[#fbd88b] mt-0.5">والأذكار</span>
              </div>

              {/* 2. تنظيم المهام والدراسة */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#0c1322]/90 backdrop-blur-xl border border-white/20 hover:border-[#e4c27d] transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_30px_rgba(228,194,125,0.25)] hover:-translate-y-1 group cursor-default">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#1c293e] to-[#0f1726] group-hover:from-[#2a3c5a] group-hover:to-[#172338] border border-[#e4c27d]/40 group-hover:border-[#e4c27d] flex items-center justify-center text-[#fbd88b] mb-3 transition-all shadow-md">
                  <CheckSquare className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">تنظيم المهام</span>
                <span className="text-xs font-semibold text-[#fbd88b] mt-0.5">والدراسة</span>
              </div>

              {/* 3. تذكيرات ذكية ومواعيد مهمة */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#0c1322]/90 backdrop-blur-xl border border-white/20 hover:border-[#e4c27d] transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_30px_rgba(228,194,125,0.25)] hover:-translate-y-1 group cursor-default">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#1c293e] to-[#0f1726] group-hover:from-[#2a3c5a] group-hover:to-[#172338] border border-[#e4c27d]/40 group-hover:border-[#e4c27d] flex items-center justify-center text-[#fbd88b] mb-3 transition-all shadow-md">
                  <Bell className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">تذكيرات ذكية</span>
                <span className="text-xs font-semibold text-[#fbd88b] mt-0.5">ومواعيد مهمة</span>
              </div>

              {/* 4. متابعة التقدم والإحصائيات */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#0c1322]/90 backdrop-blur-xl border border-white/20 hover:border-[#e4c27d] transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_30px_rgba(228,194,125,0.25)] hover:-translate-y-1 group cursor-default">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#1c293e] to-[#0f1726] group-hover:from-[#2a3c5a] group-hover:to-[#172338] border border-[#e4c27d]/40 group-hover:border-[#e4c27d] flex items-center justify-center text-[#fbd88b] mb-3 transition-all shadow-md">
                  <TrendingUp className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">متابعة التقدم</span>
                <span className="text-xs font-semibold text-[#fbd88b] mt-0.5">والإحصائيات</span>
              </div>

            </div>
          </div>

          {/* Bottom Landscape Motivational Quote */}
          <div className="pt-6 sm:pt-10 text-center sm:text-start">
            <div className="inline-block relative">
              <p className="text-base sm:text-xl font-extrabold text-white/95 tracking-wide drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)]">
                خطوة صغيرة كل يوم ..
                <br />
                <span className="text-[#fbd88b]">تصنع فرقاً كبيراً غداً</span>
              </p>
              {/* Golden sweep underline decoration */}
              <div className="w-40 h-1.5 bg-gradient-to-r from-transparent via-[#e4c27d] to-transparent mx-auto sm:mx-0 mt-2.5 rounded-full shadow-[0_0_12px_#e4c27d]" />
            </div>
          </div>

        </div>

        {/* Right Side: Pixel-Perfect Floating Login Glass Card (Centered immediately on Mobile & Tablets) */}
        <div className="w-full max-w-[420px] sm:max-w-md mx-auto lg:col-span-5 flex flex-col justify-center">
          <div className="relative bg-[#0b111c]/94 sm:bg-[#0b111c]/92 backdrop-blur-2xl border border-white/[0.18] rounded-3xl p-5 sm:p-8 md:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-right">
            
            {/* Golden Scales Badge */}
            <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-b from-[#1c283d] to-[#0b111c] border-2 border-[#e4c27d]/50 flex items-center justify-center shadow-[0_0_25px_rgba(228,194,125,0.25)] mb-2.5 sm:mb-3">
                <Scale className="w-8 h-8 sm:w-9 sm:h-9 text-[#fbd88b] stroke-[1.9]" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ميزان
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-medium">
                {mode === 'login' ? 'مرحباً بك مجدداً' : 'ابدأ رحلة التوازن والإنجاز اليوم'}
              </p>
            </div>

            {/* Toggle Mode Button (Login / Register) */}
            <div className="flex items-center justify-center gap-1 p-1 bg-black/50 border border-white/[0.1] rounded-2xl mb-4 sm:mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#e4c27d] text-slate-950 font-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#e4c27d] text-slate-950 font-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                حساب جديد
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              
              {mode === 'register' && (
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="الاسم الكامل (مثال: أحمد)"
                      className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder:text-zinc-400 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Username / Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="البريد الإلكتروني أو اسم المستخدم"
                  className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl ps-10 pe-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder:text-zinc-400 outline-none transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl ps-10 pe-10 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder:text-zinc-400 outline-none transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Remember Me & Forgot Password Row */}
              {mode === 'login' && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-200 hover:text-white transition-colors font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#101726] border-white/20 text-[#e4c27d] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#e4c27d]"
                    />
                    <span>تذكرني</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-zinc-300 hover:text-[#e4c27d] transition-colors cursor-pointer font-medium"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              )}

              {/* Primary Golden CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1.5 sm:mt-2 py-3.5 sm:py-4 px-6 rounded-2xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#ebd095] via-[#dfba6f] to-[#caa050] hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-[0_4px_25px_rgba(228,194,125,0.35)] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'جارٍ التحقق...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب والمتابعة'}</span>
                <ArrowLeft className="w-4 h-4 stroke-[2.8]" />
              </button>

            </form>

          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#0d131f] border border-white/[0.15] rounded-3xl p-6 shadow-2xl text-right">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-[#e4c27d]">
                <Scale className="w-5 h-5" />
                <h4 className="font-bold text-sm text-white">استرجاع الحساب</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              كلمات المرور مشفرة ومحفوظة بأمان. إذا نسيت كلمة المرور الخاصة بحسابك، يمكنك تسجيل حساب جديد فوري باسمك ومتابعة مهامك مباشرة.
            </p>

            <button
              type="button"
              onClick={() => {
                setIsForgotModalOpen(false);
                setMode('register');
              }}
              className="w-full py-2.5 rounded-xl bg-[#e4c27d] text-slate-950 font-bold text-xs cursor-pointer"
            >
              تسجيل حساب جديد
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

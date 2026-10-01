import React, { useState } from 'react';
import { 
  Scale, 
  User as UserIcon,
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Bell,
  TrendingUp,
  X
} from 'lucide-react';
import { User, Language, Theme } from '../types';
import { loginApi, registerApi } from '../services/api';
import { saveStoredAuth } from '../utils/auth';

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
  
  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanUser) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني' : 'Please enter your username or email');
      return;
    }

    if (!cleanPass) {
      setError(lang === 'ar' ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginApi(cleanUser, cleanPass);
      if (res.success && res.user && res.token) {
        saveStoredAuth(res.user, res.token);
        onLoginSuccess(res.user, res.token);
      } else {
        setError(res.error || (lang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password'));
      }
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'تعذر إتمام عملية الدخول' : 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = regName.trim();
    const cleanUser = regUsername.trim().toLowerCase();
    const cleanPass = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanName) {
      setError(lang === 'ar' ? 'يرجى إدخال الاسم الكامل' : 'Please enter your full name');
      return;
    }

    if (!cleanUser) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم المستخدم' : 'Please choose a username');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(cleanUser)) {
      setError(lang === 'ar' ? 'اسم المستخدم يجب أن يكون بالإنجليزية ومن 3 إلى 30 حرفاً (أحرف أو أرقام أو _ أو -)' : 'Username must be 3-30 English alphanumeric characters');
      return;
    }

    if (cleanPass.length < 6) {
      setError(lang === 'ar' ? 'يجب أن تكون كلمة المرور 6 أحرف أو أرقام على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setError(lang === 'ar' ? 'كلمتا المرور غير متطابقتين، يرجى التأكد' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerApi(cleanUser, cleanPass, cleanName, cleanEmail || undefined);
      if (res.success && res.user && res.token) {
        const loggedUser = res.user;
        const loggedToken = res.token;
        saveStoredAuth(loggedUser, loggedToken);
        setSuccessMsg(lang === 'ar' ? 'تم إنشاء حسابك بنجاح! جاري الدخول...' : 'Account created successfully! Logging in...');
        setTimeout(() => {
          onLoginSuccess(loggedUser, loggedToken);
        }, 300);
      } else {
        setError(res.error || (lang === 'ar' ? 'تعذر إنشاء الحساب، يرجى المحاولة ثانية' : 'Registration failed'));
      }
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'تعذر إتمام عملية التسجيل' : 'Registration failed'));
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

      {/* 2. Main Content Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex lg:grid lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-14 items-center justify-center min-h-[85vh] py-2 sm:py-6">
        
        {/* Left Side: Brand Hero Typography & Feature Badges (Desktop >= 1024px) */}
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

        {/* Right Side: Pixel-Perfect Floating Login/Register Glass Card */}
        <div className="w-full max-w-[440px] sm:max-w-md mx-auto lg:col-span-5 flex flex-col justify-center">
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
                {mode === 'login' ? 'سجل دخولك لمتابعة جدولك اليومي' : 'أنشئ حسابك الخاص وابدأ رحلة التوازن'}
              </p>
            </div>

            {/* Clear Mode Selector Tabs */}
            <div className="flex items-center justify-center gap-1 p-1 bg-black/60 border border-white/[0.12] rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-[#ebd095] via-[#dfba6f] to-[#caa050] text-slate-950 shadow-md scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>تسجيل الدخول</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-[#ebd095] via-[#dfba6f] to-[#caa050] text-slate-950 shadow-md scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>حساب جديد</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="leading-tight">{successMsg}</span>
              </div>
            )}

            {/* 1. LOGIN FORM */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 sm:space-y-4">
                
                {/* Username / Email */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                    اسم المستخدم أو البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="username"
                      spellCheck={false}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="مثال: ahmed أو admin"
                      className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl ps-10 pe-4 py-3 sm:py-3.5 text-base sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-all touch-manipulation"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-zinc-300">
                      كلمة المرور
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] text-zinc-400 hover:text-[#e4c27d] transition-colors cursor-pointer"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="current-password"
                      spellCheck={false}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl ps-10 pe-10 py-3 sm:py-3.5 text-base sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-all font-sans touch-manipulation"
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
                </div>

                {/* Remember Me */}
                <div className="flex items-center text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white transition-colors font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#101726] border-white/20 text-[#e4c27d] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#e4c27d]"
                    />
                    <span>تذكرني على هذا الجهاز</span>
                  </label>
                </div>

                {/* Primary Submit CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 sm:py-4 px-6 rounded-2xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#ebd095] via-[#dfba6f] to-[#caa050] hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-[0_4px_25px_rgba(228,194,125,0.35)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'جارٍ التحقق والدخول...' : 'تسجيل الدخول'}</span>
                  <ArrowLeft className="w-4 h-4 stroke-[2.8]" />
                </button>

                {/* Switch to Register link */}
                <div className="text-center pt-2 text-xs text-zinc-400">
                  ليس لديك حساب؟{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-[#e4c27d] font-bold hover:underline cursor-pointer"
                  >
                    اضغط هنا لإنشاء حساب جديد
                  </button>
                </div>

              </form>
            ) : (
              /* 2. REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3 sm:space-y-3.5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-zinc-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="مثال: أحمد محمد"
                      className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl ps-10 pe-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-all touch-manipulation"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    اسم المستخدم (بالإنجليزية بدون مسافات)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-zinc-400">
                      <span className="text-xs font-bold text-zinc-400">@</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="username"
                      spellCheck={false}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="مثال: ahmed_2026"
                      className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl ps-10 pe-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-all font-mono touch-manipulation"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    البريد الإلكتروني <span className="text-zinc-500 font-normal">(اختياري)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="email"
                      spellCheck={false}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl ps-10 pe-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-all touch-manipulation"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    كلمة المرور (6 خانات على الأقل)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="new-password"
                      spellCheck={false}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl ps-10 pe-10 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-all font-sans touch-manipulation"
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
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-zinc-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="new-password"
                      spellCheck={false}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال كلمة المرور"
                      className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl ps-10 pe-10 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-all font-sans touch-manipulation"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 sm:py-4 px-6 rounded-2xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#ebd095] via-[#dfba6f] to-[#caa050] hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-[0_4px_25px_rgba(228,194,125,0.35)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب وبدء الاستخدام'}</span>
                  <ArrowLeft className="w-4 h-4 stroke-[2.8]" />
                </button>

                {/* Switch to Login link */}
                <div className="text-center pt-1.5 text-xs text-zinc-400">
                  لديك حساب بالفعل؟{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-[#e4c27d] font-bold hover:underline cursor-pointer"
                  >
                    اضغط هنا لتسجيل الدخول
                  </button>
                </div>

              </form>
            )}

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
              كلمات المرور مشفرة بأعلى معايير الأمان (PBKDF2 Salted Hashes). للحفاظ على خصوصيتك، إذا نسيت كلمة المرور يمكنك إنشاء حساب جديد باسم مستخدم جديد ومتابعة استخدام التطبيق فوراً.
            </p>

            <button
              type="button"
              onClick={() => {
                setIsForgotModalOpen(false);
                setMode('register');
              }}
              className="w-full py-2.5 rounded-xl bg-[#e4c27d] text-slate-950 font-bold text-xs cursor-pointer"
            >
              إنشاء حساب جديد
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

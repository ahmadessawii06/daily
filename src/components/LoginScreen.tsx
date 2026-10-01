import React, { useState } from 'react';
import { 
  Scale, 
  KeyRound, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  Laptop, 
  Tablet, 
  UserPlus, 
  LogIn,
  CheckSquare,
  Bell,
  TrendingUp
} from 'lucide-react';
import { User, Language, Theme } from '../types';
import { createUserApi, accessUserApi } from '../services/api';
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
  const [tab, setTab] = useState<'existing' | 'new'>('existing');
  
  // Existing User Code
  const [inputCode, setInputCode] = useState('');
  
  // New User Creation
  const [customName, setCustomName] = useState('');
  const [generatedUser, setGeneratedUser] = useState<User | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Handle Access by Existing Code
  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setError(lang === 'ar' ? 'يرجى إدخال كود ميزان الخاص بك' : 'Please enter your Mizan Code');
      return;
    }

    setIsLoading(true);

    try {
      const res = await accessUserApi(cleanCode);
      if (res.success && res.user) {
        saveStoredAuth(res.user);
        setSuccessMsg(lang === 'ar' ? `أهلاً بك مجدداً (${res.user.userCode})! جاري تحميل بياناتك...` : `Welcome back (${res.user.userCode})! Loading...`);
        setTimeout(() => {
          onLoginSuccess(res.user!, res.user!.userCode);
        }, 300);
      } else {
        setError(res.error || (lang === 'ar' ? 'كود المستخدم غير مسجل، يرجى التأكد من الكود' : 'Invalid User Code'));
      }
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'تعذر التحقق من الكود' : 'Access failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Generate New User Code
  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await createUserApi(customName.trim() || undefined);
      if (res.success && res.user) {
        setGeneratedUser(res.user);
        saveStoredAuth(res.user);
        setSuccessMsg(lang === 'ar' ? `تم إنشاء كود ميزان الفريد الخاص بك: ${res.user.userCode}` : `Your Mizan Code is created: ${res.user.userCode}`);
      } else {
        setError(res.error || (lang === 'ar' ? 'تعذر إنشاء كود جديد' : 'Failed to generate code'));
      }
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'حدث خطأ أثناء إنشاء الحساب' : 'Error creating code'));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Copy User Code to Clipboard
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // 4. Proceed to Mizan with newly generated user
  const handleEnterWithGenerated = () => {
    if (generatedUser) {
      onLoginSuccess(generatedUser, generatedUser.userCode);
    }
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-x-hidden font-['Alexandria','Cairo',sans-serif] bg-slate-950 text-white select-none">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/src/assets/images/mizan_login_bg_1790796490412.jpg"
          alt="ميزان"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.92] contrast-[1.05]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/55 to-black/65 pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/85 pointer-events-none" />
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex lg:grid lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-14 items-center justify-center min-h-[85vh] py-2 sm:py-6">
        
        {/* Left Side: Brand Hero Typography & Multi-Device Showcase (Desktop >= 1024px) */}
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
              منصة متكاملة تنظم عباداتك وعاداتك ودراستك ومهامك اليومية، وتربط أجهزتك معاً بكود بسيط وسهل دون الحاجة لكلمات مرور معقدة.
            </p>

            {/* Multi-Device Sync Card */}
            <div className="p-4.5 rounded-2xl bg-[#0c1322]/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.6)]">
              <div className="text-xs font-bold text-[#fbd88b] mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e4c27d]" />
                <span>مزامنة فورية عبر كود ميزان (User Code):</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <Laptop className="w-6 h-6 text-[#fedf98] mb-1.5" />
                  <span className="text-xs font-bold text-white">اللابتوب</span>
                  <span className="text-[10px] text-zinc-400">نفس الكود</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <Smartphone className="w-6 h-6 text-[#fedf98] mb-1.5" />
                  <span className="text-xs font-bold text-white">الهاتف</span>
                  <span className="text-[10px] text-zinc-400">نفس الكود</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <Tablet className="w-6 h-6 text-[#fedf98] mb-1.5" />
                  <span className="text-xs font-bold text-white">الآيباد</span>
                  <span className="text-[10px] text-zinc-400">نفس الكود</span>
                </div>
              </div>
            </div>

            {/* 4 Feature Badges */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 pt-2">
              <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-[#0c1322]/85 border border-white/15">
                <svg className="w-5 h-5 text-[#fbd88b] mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2"/>
                  <circle cx="12" cy="11" r="7" strokeWidth="2"/>
                </svg>
                <span className="text-xs font-bold text-white">العبادات والأذكار</span>
              </div>
              <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-[#0c1322]/85 border border-white/15">
                <CheckSquare className="w-5 h-5 text-[#fbd88b] mb-2" />
                <span className="text-xs font-bold text-white">تنظيم المهام</span>
              </div>
              <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-[#0c1322]/85 border border-white/15">
                <Bell className="w-5 h-5 text-[#fbd88b] mb-2" />
                <span className="text-xs font-bold text-white">تذكيرات ذكية</span>
              </div>
              <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-[#0c1322]/85 border border-white/15">
                <TrendingUp className="w-5 h-5 text-[#fbd88b] mb-2" />
                <span className="text-xs font-bold text-white">متابعة الإحصائيات</span>
              </div>
            </div>

          </div>

          {/* Bottom Motivational Quote */}
          <div className="pt-4 text-start">
            <p className="text-base sm:text-lg font-extrabold text-white/90">
              خطوة صغيرة كل يوم .. <span className="text-[#fbd88b]">تصنع فرقاً كبيراً غداً</span>
            </p>
          </div>

        </div>

        {/* Right Side: Floating User Code Glass Card */}
        <div className="w-full max-w-[440px] sm:max-w-md mx-auto lg:col-span-5 flex flex-col justify-center">
          <div className="relative bg-[#0b111c]/94 sm:bg-[#0b111c]/92 backdrop-blur-2xl border border-white/[0.18] rounded-3xl p-5 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-right">
            
            {/* Header Badge */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#1c283d] to-[#0b111c] border-2 border-[#e4c27d]/50 flex items-center justify-center shadow-[0_0_25px_rgba(228,194,125,0.25)] mb-2.5">
                <Scale className="w-8 h-8 text-[#fbd88b] stroke-[1.9]" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ميزان
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-medium">
                نظام كود المستخدم البسيط (User Code)
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            {!generatedUser && (
              <div className="flex items-center justify-center gap-1 p-1 bg-black/60 border border-white/[0.12] rounded-2xl mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setTab('existing');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tab === 'existing'
                      ? 'bg-gradient-to-r from-[#ebd095] via-[#dfba6f] to-[#caa050] text-slate-950 shadow-md scale-[1.02]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>لدي كود ميزان</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab('new');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tab === 'new'
                      ? 'bg-gradient-to-r from-[#ebd095] via-[#dfba6f] to-[#caa050] text-slate-950 shadow-md scale-[1.02]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>مستخدم جديد</span>
                </button>
              </div>
            )}

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

            {/* If a new user code was just generated, show the Golden Presentation Card */}
            {generatedUser ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1c2a40] to-[#0f1828] border-2 border-[#e4c27d] text-center shadow-[0_0_30px_rgba(228,194,125,0.25)]">
                  <div className="text-xs font-bold text-zinc-300 mb-2">
                    كود ميزان الخاص بك هو:
                  </div>
                  
                  {/* Big Code Display */}
                  <div className="py-3 px-4 rounded-xl bg-black/60 border border-[#e4c27d]/40 mb-3.5">
                    <span className="font-mono text-3xl sm:text-4xl font-black text-[#fedf98] tracking-widest select-all">
                      {generatedUser.userCode}
                    </span>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyCode(generatedUser.userCode)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">تم نسخ الكود بنجاح!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-[#e4c27d]" />
                        <span>نسخ الكود واستخدامه على باقي الأجهزة</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed text-center px-2">
                  احفظ هذا الكود، يمكنك استخدامه على اللابتوب، الهاتف، أو الآيباد لمزامنة جميع بياناتك ومهامك!
                </p>

                {/* Enter Button */}
                <button
                  type="button"
                  onClick={handleEnterWithGenerated}
                  className="w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#ebd095] via-[#dfba6f] to-[#caa050] hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-[0_4px_25px_rgba(228,194,125,0.35)] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>الدخول إلى ميزان الآن</span>
                  <ArrowLeft className="w-4 h-4 stroke-[2.8]" />
                </button>
              </div>
            ) : tab === 'existing' ? (
              /* TAB 1: ENTER EXISTING USER CODE */
              <form onSubmit={handleAccessSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                    أدخل كود ميزان (User Code)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-zinc-400">
                      <KeyRound className="w-4 h-4 text-[#e4c27d]" />
                    </div>
                    <input
                      type="text"
                      required
                      value={inputCode}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder="مثال: A7K9P2"
                      className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl ps-10 pe-4 py-3 sm:py-3.5 text-sm sm:text-base font-mono font-bold tracking-wider text-white placeholder:text-zinc-500 placeholder:font-sans outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[11px] text-zinc-300 leading-relaxed">
                  💡 <strong>ملاحظة:</strong> إذا كان لديك كود أنشأته على اللابتوب أو الهاتف، اكتبه هنا للوصول إلى نفس مهامك وعاداتك مباشرة.
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 sm:py-4 px-6 rounded-2xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#ebd095] via-[#dfba6f] to-[#caa050] hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-[0_4px_25px_rgba(228,194,125,0.35)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'جارٍ التحقق وتحميل البيانات...' : 'دخول واسترجاع البيانات'}</span>
                  <ArrowLeft className="w-4 h-4 stroke-[2.8]" />
                </button>

                <div className="text-center pt-2 text-xs text-zinc-400">
                  مستخدم جديد؟{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setTab('new');
                      setError(null);
                    }}
                    className="text-[#e4c27d] font-bold hover:underline cursor-pointer"
                  >
                    اضغط هنا لتوليد كود جديد
                  </button>
                </div>
              </form>
            ) : (
              /* TAB 2: CREATE NEW USER / GENERATE CODE */
              <form onSubmit={handleCreateNewUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                    الاسم <span className="text-zinc-500 font-normal">(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="مثال: أحمد"
                    className="w-full bg-[#101726] border border-white/[0.15] focus:border-[#e4c27d] rounded-2xl px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-all"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#121c2e] to-[#0c1322] border border-[#e4c27d]/30 text-xs text-zinc-200 leading-relaxed space-y-1.5">
                  <div className="font-bold text-[#fbd88b] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>توليد كود ميزان فوري:</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    سيتم إنشاء كود فريد لك (مثل: <code>A7K9P2</code>) وحفظ حسابك في قاعدة البيانات. يمكنك استخدام الكود للدخول من أي جهاز في أي وقت.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 sm:py-4 px-6 rounded-2xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#ebd095] via-[#dfba6f] to-[#caa050] hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-[0_4px_25px_rgba(228,194,125,0.35)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? 'جارٍ إنشاء الكود...' : 'إنشاء وتوليد كود ميزان الجديد'}</span>
                </button>

                <div className="text-center pt-2 text-xs text-zinc-400">
                  لديك كود مسبقاً؟{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setTab('existing');
                      setError(null);
                    }}
                    className="text-[#e4c27d] font-bold hover:underline cursor-pointer"
                  >
                    اضغط هنا لإدخال كودك
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};

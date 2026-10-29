import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  formatShortDate,
  toLatinDigits,
} from './utils/date';
import { getPrayerTimeZoneDate } from './utils/prayerSchedule';
import {
  getDayRecord,
  loadAllDays,
  addTaskToDay,
  updateTaskInDay,
  deleteTaskFromDay,
  restoreTaskToDay,
  moveTasksToNextDay,
  getAllArchiveDays,
  resetToDefaults,
  getStoredTheme,
  setStoredTheme,
  apply24HourTemplate,
} from './utils/storage';

import { triggerSync } from './services/syncEngine';
import { enqueue } from './services/syncQueue';
import { userStorage } from './utils/scopedStorage';
import { DayRecord, Language, PlannerView, StatusFilter, Task, TaskStatus, Theme, User } from './types';
import { getStoredAuth, clearStoredAuth, saveStoredAuth, beginSupportSession, originalAdminSession, clearSupportSession } from './utils/auth';
import { requestApi } from './services/api';
import { hasPermission } from './shared/admin';
import { pageFromHash, pageHash, type AppPage } from './utils/navigation';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { LoginScreen } from './components/LoginScreen';
import { AuthLoadingScreen } from './components/AuthLoadingScreen';
import { ScreenshotLoadingScreen } from './components/ScreenshotLoadingScreen';
import { CardsDashboard } from './components/CardsDashboard';
import { getPlannerWorkspace, readStoredWorkspace, resetPlannerWorkspace, setPlannerView, updatePlannerCategory } from './utils/workspace';
import { deletePlannerCategoryAndTasks, restorePlannerCategoryAndTasks, type CategoryDeletionSnapshot } from './utils/categoryDeletion';
import { activeCategories, UNASSIGNED_CATEGORY } from './shared/workspace';
import { getTaskCardCategories } from './utils/cardCategories';
import { partitionPrayerTasks } from './utils/prayerTasks';
import { calculateDailyProgress } from './utils/dailyProgress';
import { shouldPlayListCompletionSound } from './utils/listCompletion';
import { canMoveTask } from './shared/taskPlanning';
import { MainHeader } from './components/MainHeader';
import { applyColorTheme, readColorTheme } from './utils/colorThemes';
import { TodayProgress } from './components/TodayProgress';
import { PrayerCard } from './components/PrayerCard';
import { DateNavigation } from './components/DateNavigation';
import { DayMemories } from './components/DayMemories';
import { QuickNotes } from './components/QuickNotes';
import { PlannerBackdrop } from './components/PlannerBackdrop';
import { TaskList } from './components/TaskList';
import { WeeklyReview } from './components/WeeklyReview';
import { Archive } from './components/Archive';
import { AccountPage } from './components/AccountPage';
import { AddTaskModal } from './components/AddTaskModal';
import { TaskDestinationDialog } from './components/TaskDestinationDialog';
import { EditTaskModal } from './components/EditTaskModal';
import { ExportScheduleModal } from './components/ExportScheduleModal';

import { playAchievementSound, playFailureSound, playChallengeCompleteSound, preloadChallengeCompleteSound } from './utils/soundEffects';
import { AlertCircle, CalendarArrowUp, CheckCircle2, LayoutGrid, ListChecks, Plus, Undo2, X } from 'lucide-react';
import { OnboardingTour } from './components/OnboardingTour';
import { shouldShowOnboarding, saveOnboardingStatus } from './utils/onboardingStorage';
import type { ReligiousSection } from './components/religiousContent';
import { ReligiousTabs } from './components/ReligiousTabs';
import { AdhkarSection } from './components/AdhkarSection';
import { MorningAdhkarIslamBook } from './components/MorningAdhkarIslamBook';
import { EveningAdhkarIslamBook } from './components/EveningAdhkarIslamBook';
import { QuranWirdSection } from './components/QuranWirdSection';
import { DuasSection } from './components/DuasSection';
import { ComingSoonFeature } from './components/ComingSoonFeature';
import { BookOpen, HandHeart } from 'lucide-react';
import { MORNING_ADHKAR, EVENING_ADHKAR } from './components/religiousContent';

import { SettingsPage } from './components/SettingsPage';
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));

export default function App() {
  useEffect(() => { applyColorTheme(readColorTheme()); }, []);
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredAuth().user);
  const [page, setPage] = useState<AppPage>(() => pageFromHash(location.hash));
  const navigate = (next: AppPage) => {
    location.hash = pageHash(next);
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const [resetToken, setResetToken] = useState(() => {
    const match = /^#reset=([a-f0-9]{64})$/.exec(location.hash);
    return match?.[1] || null;
  });
  useEffect(() => { if (resetToken && location.hash.startsWith('#reset=')) history.replaceState(null, '', location.pathname + location.search); }, [resetToken]);
  const [endingSupport, setEndingSupport] = useState(false);
  const [supportError, setSupportError] = useState('');
  const endingSupportRef = useRef(false);
  const support = currentUser?.impersonation;
  const endSupport = useCallback(async () => {
    const grantId = getStoredAuth().user?.impersonation?.id;
    if (!grantId || endingSupportRef.current) return;
    endingSupportRef.current = true; setEndingSupport(true); setSupportError('');
    const original = originalAdminSession();
    try {
      if (!original?.token) { clearStoredAuth(); location.reload(); return; }
      const response = await requestApi('/auth/impersonation/end', { grantId }, original.token);
      clearSupportSession(); saveStoredAuth(response.user, original.token);
      location.hash = '#admin'; location.reload();
    } catch (e) {
      // Keep the visible banner until the server acknowledges the end or the operator signs out.
      setSupportError((e as Error).message); endingSupportRef.current = false; setEndingSupport(false);
    }
  }, []);
  useEffect(() => {
    const authExpired = () => {
      if (getStoredAuth().user?.impersonation) { void endSupport(); return; }
      clearStoredAuth(); setCurrentUser(null); setPage('planner');
      history.replaceState(null, '', location.pathname + location.search);
    };
    const hashChanged = () => {
      const reset = /^#reset=([a-f0-9]{64})$/.exec(location.hash);
      if (reset) { setResetToken(reset[1]); history.replaceState(null, '', location.pathname + location.search); }
      setPage(pageFromHash(location.hash));
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('mizan:auth-expired', authExpired);
    window.addEventListener('hashchange', hashChanged);
    return () => { window.removeEventListener('mizan:auth-expired', authExpired); window.removeEventListener('hashchange', hashChanged); };
  }, [endSupport]);
  useEffect(() => {
    if (!support) return;
    const timer = setTimeout(() => { void endSupport(); }, Math.max(0, Date.parse(support.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [support?.id, endSupport]);
  useEffect(() => {
    if (!currentUser) return;
    let disposed = false;
    const verify = async () => {
      const session = getStoredAuth();
      try {
        const result = await requestApi('/auth/me');
        if (!disposed && session.token === getStoredAuth().token) { saveStoredAuth(result.user, session.token!); setCurrentUser(result.user); }
      } catch { /* requestApi handles a revoked or expired session. */ }
    };
    void verify(); const timer = setInterval(() => { void verify(); }, 30000);
    return () => { disposed = true; clearInterval(timer); };
  }, [currentUser?.id]);
  const [isPreparingWorkspace, setIsPreparingWorkspace] = useState(() => Boolean(
    getStoredAuth().user && !readStoredWorkspace() && Object.keys(loadAllDays()).length === 0
  ));
  const [workspace, setWorkspace] = useState(() => getPlannerWorkspace(getPrayerTimeZoneDate(new Date())));

  // Navigation & view states
  const [lang, setLang] = useState<Language>('ar');
  const [cardColumns, setCardColumns] = useState<2 | 3 | 4>(() => {
    try {
      const stored = localStorage.getItem('mizan_card_columns');
      return stored === '2' ? 2 : stored === '3' ? 3 : 4;
    } catch { return 4; }
  });
  const toggleCardColumns = () => {
    const next = cardColumns === 4 ? 2 : cardColumns === 2 ? 3 : 4;
    setCardColumns(next);
    try { localStorage.setItem('mizan_card_columns', String(next)); } catch {}
  };
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [currentDate, setCurrentDateState] = useState<string>(() => getPrayerTimeZoneDate(new Date()));
  const followsTodayDate = useRef(true);
  const setCurrentDate = useCallback((date: string) => {
    followsTodayDate.current = date === getPrayerTimeZoneDate(new Date());
    setCurrentDateState(date);
  }, []);
  const [currentFilter, setCurrentFilter] = useState<StatusFilter>('all');
  const [religiousSection, setReligiousSection] = useState<ReligiousSection>('prayers');
  useEffect(() => {
    const updateTodayDate = () => {
      if (!followsTodayDate.current) return;
      const today = getPrayerTimeZoneDate(new Date());
      setCurrentDateState(current => current === today ? current : today);
    };
    const interval = window.setInterval(updateTodayDate, 30000);
    window.addEventListener('focus', updateTodayDate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', updateTodayDate);
    };
  }, []);

  // Modals state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isTaskDestinationOpen, setIsTaskDestinationOpen] = useState(false);
  const [cardCreationTarget, setCardCreationTarget] = useState<{ categoryId: string; requestId: number } | null>(null);
  const cardCreationRequest = useRef(0);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState(true);
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  const [deletedTasks, setDeletedTasks] = useState<{ ownerId: string; date: string; task: Task; deletedAt: string; expiresAt: number }[]>([]);
  const [deletedCategories, setDeletedCategories] = useState<{ ownerId: string; snapshot: CategoryDeletionSnapshot; expiresAt: number }[]>([]);
  const [undoPaused, setUndoPaused] = useState(false);
  useEffect(() => { setDeletedTasks([]); setDeletedCategories([]); setUndoPaused(false); }, [currentUser?.id, support?.id]);
  useEffect(() => {
    if (!deletedTasks.length || undoPaused) return;
    const timer = setTimeout(() => setDeletedTasks(entries => entries.filter(entry => entry.expiresAt > Date.now())), Math.max(0, Math.min(...deletedTasks.map(entry => entry.expiresAt)) - Date.now()));
    return () => clearTimeout(timer);
  }, [deletedTasks, undoPaused]);
  useEffect(() => {
    if (!deletedCategories.length || undoPaused) return;
    const timer = setTimeout(() => setDeletedCategories(entries => entries.filter(entry => entry.expiresAt > Date.now())), Math.max(0, Math.min(...deletedCategories.map(entry => entry.expiresAt)) - Date.now()));
    return () => clearTimeout(timer);
  }, [deletedCategories, undoPaused]);

  // Give the animated interlude time to appear after an explicit sign-in.
  const loginLoadingUntil = useRef(0);

  // Tasks for currentDate
  const [tasks, setTasks] = useState<Task[]>([]);
  // Archive days
  const [archiveDays, setArchiveDays] = useState(() => getAllArchiveDays());

  useEffect(() => { if (currentUser) preloadChallengeCompleteSound(); }, [currentUser?.id]);

  const isFirstThemeRender = useRef(true);
  // Apply the active account's theme to the document with smooth transitions.
  useEffect(() => {
    const root = document.documentElement;
    if (isFirstThemeRender.current) {
      isFirstThemeRender.current = false;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
      return;
    }
    root.classList.remove('theme-transitioning');
    void root.offsetWidth;
    root.classList.add('theme-transitioning');
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    const timer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 340);
    return () => clearTimeout(timer);
  }, [theme]);

  useEffect(() => {
    if (!currentUser) return;
    let disposed = false;
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (disposed) return;
      setWorkspace(getPlannerWorkspace(currentDate));
      setTasks(getDayRecord(currentDate).tasks);
      setArchiveDays(getAllArchiveDays());
      setTheme(getStoredTheme());
      setLang(userStorage.getItem('lang') === 'en' ? 'en' : 'ar');
    };
    if (!isPreparingWorkspace) refresh();
    window.addEventListener('mizan:data-synced', refresh);
    window.addEventListener('mizan:workspace-changed', refresh);
    const syncOnFocus = () => { void triggerSync(currentUser.id, true); };
    window.addEventListener('focus', syncOnFocus);
    const interval = setInterval(syncOnFocus, 30000);
    void triggerSync(currentUser.id, true).finally(() => {
      if (disposed) return;
      const finish = () => { if (!disposed) { refresh(); setIsPreparingWorkspace(false); } };
      const remaining = loginLoadingUntil.current - Date.now();
      if (remaining > 0) loadingTimer = setTimeout(finish, remaining);
      else finish();
    });
    return () => {
      disposed = true;
      clearTimeout(loadingTimer);
      clearInterval(interval);
      window.removeEventListener('focus', syncOnFocus);
      window.removeEventListener('mizan:data-synced', refresh);
      window.removeEventListener('mizan:workspace-changed', refresh);
    };
  }, [currentDate, currentUser?.id]);

  const isFirstLangRender = useRef(true);
  useEffect(() => {
    const root = document.documentElement;
    const currentScrollY = window.scrollY;

    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Keep scroll position completely stable across direction flip
    if (window.scrollY !== currentScrollY) {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' });
    }
    requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - currentScrollY) > 1) {
        window.scrollTo({ top: currentScrollY, behavior: 'instant' });
      }
    });

    if (isFirstLangRender.current) {
      isFirstLangRender.current = false;
      return;
    }
    root.classList.remove('lang-transitioning');
    void root.offsetWidth;
    root.classList.add('lang-transitioning');
    const timer = setTimeout(() => {
      root.classList.remove('lang-transitioning');
    }, 320);
    return () => clearTimeout(timer);
  }, [lang]);

  useEffect(() => {
    const titles = lang === 'ar'
      ? { planner: 'ميزان', settings: 'الإعدادات', statistics: 'التقرير الأسبوعي', archive: 'الأرشيف', admin: 'إدارة المستخدمين' }
      : { planner: 'Mizan', settings: 'Settings', statistics: 'Weekly statistics', archive: 'Archive', admin: 'User management' };
    document.title = page === 'planner' ? titles.planner : `${titles[page]} · ${lang === 'ar' ? 'ميزان' : 'Mizan'}`;
  }, [page, lang]);

  useEffect(() => {
    if (!currentUser) return;
    const destination = support && page !== 'planner' ? 'planner' : page === 'admin' && !hasPermission(currentUser.role, 'users.read') ? 'settings' : null;
    if (destination) {
      history.replaceState(null, '', location.pathname + location.search + pageHash(destination));
      setPage(destination);
    }
  }, [page, currentUser?.role, currentUser?.id, support?.id]);

  useEffect(() => {
    if (!currentUser) return;
    setTheme(getStoredTheme());
    setLang(userStorage.getItem('lang') === 'en' ? 'en' : 'ar');
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser || isPreparingWorkspace || support || page !== 'planner') return;
    if (shouldShowOnboarding()) {
      setIsOnboardingOpen(true);
    }
  }, [currentUser?.id, isPreparingWorkspace, support, page]);

  const refreshArchive = useCallback(() => {
    setArchiveDays(getAllArchiveDays());
  }, []);

  const showToast = (msg: string, success = true, action?: { label: string; onClick: () => void }) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastSuccess(success);
    setToastMessage(msg);
    setToastAction(action || null);
    toastTimer.current = setTimeout(() => {
      setToastMessage(null);
      setToastAction(null);
    }, 2200);
  };

  // Handlers
  const playStatusFeedback = (before: Task[], after: Task[], taskId: string, status: TaskStatus) => {
    if (before.find(task => task.id === taskId)?.status === status || after.find(task => task.id === taskId)?.status !== status) return;
    if (status === 'done') {
      const currentWorkspace = getPlannerWorkspace(currentDate);
      if (shouldPlayListCompletionSound(before, after, currentWorkspace, currentWorkspace.view, taskId)) playChallengeCompleteSound();
      else playAchievementSound();
    } else if (status === 'not-done') playFailureSound();
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (support) return;
    const before = getDayRecord(currentDate).tasks;
    updateTaskInDay(currentDate, taskId, { status: newStatus });
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
    playStatusFeedback(before, rec.tasks, taskId, newStatus);
  };

  const handlePrayerStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (support || newStatus !== 'not-done') {
      handleStatusChange(taskId, newStatus);
      return;
    }
    if (!currentUser) return;
    const date = currentDate;
    const userId = currentUser.id;
    const previousTask = getDayRecord(date).tasks.find(task => task.id === taskId);
    handleStatusChange(taskId, newStatus);
    const updatedTask = getDayRecord(date).tasks.find(task => task.id === taskId);
    if (!previousTask || previousTask.status === newStatus || updatedTask?.status !== newStatus || !updatedTask.updatedAt) return;
    showToast(
      lang === 'ar' ? 'تم تسجيل الصلاة كفائتة' : 'Prayer marked as missed',
      true,
      {
        label: lang === 'ar' ? 'تراجع' : 'Undo',
        onClick: () => {
          const currentTask = getDayRecord(date).tasks.find(task => task.id === taskId);
          if (currentUser.id !== userId || currentTask?.status !== newStatus || currentTask.updatedAt !== updatedTask.updatedAt) {
            showToast(lang === 'ar' ? 'تعذر التراجع؛ تغيّرت حالة الصلاة.' : 'Cannot undo; the prayer has changed.', false);
            return;
          }
          updateTaskInDay(date, taskId, { status: previousTask.status, notDoneReason: previousTask.notDoneReason || '' });
          const record = getDayRecord(date);
          if (currentDate === date && currentUser.id === userId) setTasks(record.tasks);
          refreshArchive();
          showToast(lang === 'ar' ? 'تم التراجع عن تسجيل الصلاة' : 'Prayer status change undone');
        },
      },
    );
  };

  const handleAddTask = (taskInput: { title: string; time: string; status: TaskStatus; notes?: string; categoryId?: string }) => {
    if (support) return;
    const before = getDayRecord(currentDate).tasks;
    const added = addTaskToDay(currentDate, taskInput);
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
    playStatusFeedback(before, rec.tasks, added.id, added.status);
    showToast(lang === 'ar' ? 'تمت إضافة المهمة بنجاح' : 'Task added successfully');
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    if (support) return;
    const before = getDayRecord(currentDate).tasks;
    updateTaskInDay(currentDate, taskId, updates);
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
    if (updates.status) playStatusFeedback(before, rec.tasks, taskId, updates.status);
    showToast(lang === 'ar' ? 'تم حفظ التعديل' : 'Changes saved');
  };

  const handleUpdateTaskTitle = (taskId: string, newTitle: string) => {
    if (support) return;
    updateTaskInDay(currentDate, taskId, { title: newTitle });
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
    if (newTitle.trim()) {
      showToast(lang === 'ar' ? `تم تحديد: ${newTitle}` : `Saved: ${newTitle}`);
    }
  };

  const handleApply24HourTemplate = () => {
    if (support) return;
    const updatedTasks = apply24HourTemplate(currentDate, true);
    setTasks(updatedTasks);
    refreshArchive();
    showToast(
      lang === 'ar'
        ? 'تم تجهيز قالب الـ 24 ساعة لليوم بنجاح'
        : '24-hour template ready'
    );
  };

  const handleDeleteTask = (taskId: string) => {
    if (support) return;
    const removed = deleteTaskFromDay(currentDate, taskId);
    if (!removed) { showToast(lang === 'ar' ? 'تعذر حذف المهمة أو حفظ التغيير.' : 'The task could not be deleted or saved.', false); return; }
    const record = getDayRecord(currentDate);
    setDeletedTasks(entries => [...entries, { ownerId: currentUser!.id, date: currentDate, task: removed, deletedAt: record.deletedTaskIds![taskId], expiresAt: Date.now() + 10000 }]);
    setTasks(record.tasks);
    refreshArchive();
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (support) return;
    const snapshot = deletePlannerCategoryAndTasks(categoryId, currentDate);
    setDeletedCategories(entries => [...entries, { ownerId: currentUser!.id, snapshot, expiresAt: Date.now() + 10000 }]);
    setWorkspace(getPlannerWorkspace(currentDate));
    setTasks(getDayRecord(currentDate).tasks);
    refreshArchive();
  };

  const handleUndoCategoryDeletion = () => {
    if (support || getStoredAuth().user?.id !== currentUser?.id) return;
    let restored = 0;
    const remaining: typeof deletedCategories = [];
    for (const entry of deletedCategories) {
      if (entry.ownerId !== currentUser?.id || (!undoPaused && entry.expiresAt <= Date.now())) continue;
      if (restorePlannerCategoryAndTasks(entry.snapshot)) restored++;
      else remaining.push(entry);
    }
    setDeletedCategories(remaining);
    setUndoPaused(false);
    setWorkspace(getPlannerWorkspace(currentDate));
    setTasks(getDayRecord(currentDate).tasks);
    refreshArchive();
    showToast(
      restored
        ? (lang === 'ar' ? 'تمت استعادة المساحة ومهامها' : 'Space and its tasks restored')
        : (lang === 'ar' ? 'تعذر التراجع؛ ربما تغيّرت المساحة أو مهامها.' : 'Cannot undo; the space or its tasks have changed.'),
      restored > 0,
    );
  };

  const handleUndoDeletion = () => {
    if (support || getStoredAuth().user?.id !== currentUser?.id) return;
    let restored = 0;
    const retry: typeof deletedTasks = [];
    for (const entry of deletedTasks) {
      if (entry.ownerId !== currentUser?.id || (!undoPaused && entry.expiresAt <= Date.now())) continue;
      if (restoreTaskToDay(entry.date, entry.task, entry.deletedAt)) restored++;
      else {
        const record = getDayRecord(entry.date);
        if (record.deletedTaskIds?.[entry.task.id] === entry.deletedAt && !record.tasks.some(task => task.id === entry.task.id)) retry.push({ ...entry, expiresAt: Date.now() + 10000 });
      }
    }
    setDeletedTasks(retry);
    setUndoPaused(false);
    setTasks(getDayRecord(currentDate).tasks);
    refreshArchive();
    showToast(restored ? (lang === 'ar' ? `تمت استعادة ${restored} من المهام` : `Restored ${restored} task(s)`) : (lang === 'ar' ? 'تعذر الاسترجاع؛ تغيّرت المهمة أو تعذر حفظها.' : 'Cannot restore: the task changed or could not be saved.'), restored > 0);
  };
  const resumeUndoTimer = () => {
    setDeletedTasks(entries => entries.map(entry => ({ ...entry, expiresAt: Date.now() + 10000 })));
    setUndoPaused(false);
  };

  const handleMoveTasks = (taskIds: string[]) => {
    if (support) return;
    try {
      const moved = moveTasksToNextDay(currentDate, taskIds);
      if (!moved.tasks.length) return;
      setTasks(getDayRecord(currentDate).tasks);
      setEditingTask(null);
      refreshArchive();
      showToast(lang === 'ar' ? `نُقلت ${moved.tasks.length} من المهام إلى ${formatShortDate(moved.date, lang)}` : `Moved ${moved.tasks.length} task(s) to ${formatShortDate(moved.date, lang)}`);
    } catch { showToast(lang === 'ar' ? 'تعذر نقل المهام. تحقق من مساحة التخزين أو وجود المهمة في اليوم التالي.' : 'Unable to move tasks. Check device storage or whether the task already exists on the next day.', false); }
  };
  const handleMoveRemaining = () => {
    if (support) return;
    const remaining = getDayRecord(currentDate).tasks.filter(canMoveTask);
    if (!remaining.length) return;
    if (window.confirm(lang === 'ar' ? `نقل ${remaining.length} من المهام غير المكتملة إلى اليوم التالي؟ تبقى الصلوات والمهام المكتملة في يومها.` : `Move ${remaining.length} unfinished task(s) to the next day? Prayers and completed tasks stay on their day.`)) handleMoveTasks(remaining.map(task => task.id));
  };

  const handleOpenInDaily = (date: string) => {
    setCurrentDate(date);
    navigate('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompletePrayer = (title: string, time: string) => {
    handleAddTask({ title, categoryId: 'worship', time, status: 'done' });
    setCurrentFilter('all');
  };

  const handleToggleLang = () => {
    const next = lang === 'ar' ? 'en' : 'ar';
    userStorage.setItem('lang', next);
    enqueue('settings', { lang: next });
    setLang(next);
  };

  const handleResetData = () => {
    if (support) return;
    setDeletedTasks([]);
    resetToDefaults();
    setWorkspace(resetPlannerWorkspace());
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
    showToast(lang === 'ar' ? 'تم مسح المهام وإعادة ضبط العادات لهذا الحساب' : 'Tasks cleared and habits reset for this account');
  };

  const handleChangeView = (view: PlannerView) => {
    setCardCreationTarget(null);
    setWorkspace(setPlannerView(view, currentDate));
    setCurrentFilter('all');
  };

  const handleCreateInTimeline = () => {
    handleChangeView('timeline');
    setIsTaskDestinationOpen(false);
    setIsAddTaskOpen(true);
  };

  const handleCreateInCard = (categoryId: string) => {
    const category = activeCategories(getPlannerWorkspace(currentDate)).find(card => card.id === categoryId);
    if (!category && categoryId !== UNASSIGNED_CATEGORY) return;
    handleChangeView('cards');
    if (category?.collapsed) setWorkspace(updatePlannerCategory(categoryId, { collapsed: false }, currentDate));
    setCardCreationTarget({ categoryId, requestId: ++cardCreationRequest.current });
    setIsTaskDestinationOpen(false);
  };

  const [religiousTick, setReligiousTick] = useState(0);

  useEffect(() => {
    const handleReligiousProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || !detail.date || detail.date === currentDate) {
        setReligiousTick(prev => prev + 1);
      }
    };
    window.addEventListener('daily_religious_progress_changed', handleReligiousProgress);
    return () => {
      window.removeEventListener('daily_religious_progress_changed', handleReligiousProgress);
    };
  }, [currentDate]);

  const stats = useMemo(() => calculateDailyProgress(tasks, currentDate), [tasks, currentDate, religiousTick]);

  const [isExportingImage, setIsExportingImage] = useState(false);
  const [exportRequested, setExportRequested] = useState(false);

  useEffect(() => {
    if (page === 'planner') return;
    setIsAddTaskOpen(false);
    setIsTaskDestinationOpen(false);
    setEditingTask(null);
    setCardCreationTarget(null);
    setIsExportModalOpen(false);
    setExportRequested(false);
    setIsOnboardingOpen(false);
  }, [page]);

  const handleExportDailyTrackImage = async () => {
    if (isExportingImage) return;
    try {
      setIsExportingImage(true);
      showToast(
        lang === 'ar'
          ? '⏳ جارٍ تصدير لوحة جدول ميزان كاملة كصورة فائقة الدقة...'
          : '⏳ Exporting full Mizan schedule image...'
      );

      await (await import('./utils/exportDailyTrack')).exportDailyTrackToImage({
        elementId: 'daily-track-container',
        fileName: `Mizan-Schedule-${currentDate}.png`,
        theme,
      });

      showToast(
        lang === 'ar'
          ? '✓ تم تصدير وحفظ جدول ميزان بالكامل بنجاح!'
          : '✓ Full Mizan schedule saved successfully!'
      );
    } catch (error) {
      console.error('Export failed:', error);
      showToast(
        lang === 'ar'
          ? '✕ حدث خطأ أثناء تصدير الصورة'
          : '✕ Failed to export image'
      );
    } finally {
      setIsExportingImage(false);
    }
  };

  useEffect(() => {
    if (!exportRequested || page !== 'planner' || !currentUser || isPreparingWorkspace) return;
    const frame = requestAnimationFrame(() => {
      setExportRequested(false);
      void handleExportDailyTrackImage();
    });
    return () => cancelAnimationFrame(frame);
  }, [exportRequested, page, currentUser?.id, isPreparingWorkspace, currentDate, theme]);

  const handleLogout = () => {
    if (support) { void endSupport(); return; }
    void requestApi('/auth/logout', {}).catch(() => {});
    clearStoredAuth();
    setDeletedTasks([]);
    setTasks([]);
    setArchiveDays([]);
    setPage('planner');
    history.replaceState(null, '', location.pathname + location.search);
    setIsAddTaskOpen(false);
    setIsTaskDestinationOpen(false);
    setCardCreationTarget(null);
    setEditingTask(null);
    setIsExportModalOpen(false);
    setExportRequested(false);
    setIsPreparingWorkspace(false);
    setIsOnboardingOpen(false);
    setCurrentUser(null);
    showToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
  };

  const supportBanner = support && <aside role="alert" dir={lang === 'ar' ? 'rtl' : 'ltr'} className="sticky top-0 z-[80] border-b border-amber-500/30 bg-amber-100 px-4 py-3 text-amber-950 shadow-sm dark:bg-[#292311] dark:text-amber-100"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{lang === 'ar' ? 'جلسة دعم — عرض فقط' : 'Support session — read only'} · <bdi>{currentUser?.name || currentUser?.username}</bdi></p><p className="mt-1 text-xs opacity-80">{lang === 'ar' ? 'تنتهي الساعة ' : 'Expires at '}{toLatinDigits(new Date(support.expiresAt).toLocaleTimeString(lang === 'ar' ? 'ar-PS-u-nu-latn' : 'en-GB-u-nu-latn', { hour: '2-digit', minute: '2-digit' }))}</p>{supportError && <p className="mt-2 text-xs">{supportError}</p>}</div><div className="flex gap-2"><button disabled={endingSupport} onClick={() => { void endSupport(); }} className="min-h-10 rounded-xl bg-amber-950 px-4 text-xs font-semibold text-amber-50 disabled:opacity-50 dark:bg-amber-100 dark:text-amber-950">{lang === 'ar' ? 'إنهاء والعودة لحسابي' : 'End & return to my account'}</button>{supportError && <button onClick={() => { clearStoredAuth(); location.reload(); }} className="min-h-10 px-3 text-xs underline">{lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}</button>}</div></div></aside>;
  if (resetToken && !support) return <ResetPasswordScreen token={resetToken} lang={lang} onDone={() => { clearStoredAuth(); setCurrentUser(null); setResetToken(null); }} />;
  // If user is not authenticated, show Lock / Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          // The initial sync effect dismisses the loader after preparing account data.
          loginLoadingUntil.current = Date.now() + 1500;
          setIsPreparingWorkspace(true);
          setCurrentUser(user);
          showToast(lang === 'ar' ? `أهلاً بك، ${user.name || user.username}!` : `Welcome, ${user.name || user.username}!`);
        }}
        lang={lang}
        theme={theme}
      />
    );
  }

  if (isPreparingWorkspace) {
    return <>{supportBanner}<AuthLoadingScreen stage="preparing" lang={lang} theme={theme} /></>;
  }

  const feedback = (toastMessage || deletedTasks.length > 0 || deletedCategories.length > 0) && <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="fixed bottom-6 left-1/2 z-[110] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col items-center gap-2">
    {deletedCategories.length > 0 && <div data-category-delete-undo onMouseEnter={() => setUndoPaused(true)} onMouseLeave={resumeUndoTimer} onFocus={() => setUndoPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) resumeUndoTimer(); }} className="flex max-w-full flex-wrap items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-xs text-slate-900 shadow-xl dark:border-white/15 dark:bg-[#171b23] dark:text-zinc-100"><span role="status">{lang === 'ar' ? `تم حذف المساحة «${deletedCategories[deletedCategories.length - 1].snapshot.categoryName}»` : `Space “${deletedCategories[deletedCategories.length - 1].snapshot.categoryName}” deleted`}</span><button type="button" onClick={handleUndoCategoryDeletion} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 font-semibold text-emerald-700 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-emerald-300"><Undo2 aria-hidden="true" size={14} />{lang === 'ar' ? 'تراجع' : 'Undo'}</button><button type="button" aria-label={lang === 'ar' ? 'إغلاق رسالة التراجع' : 'Dismiss undo'} onClick={() => { setDeletedCategories([]); setUndoPaused(false); }} className="flex h-9 w-7 items-center justify-center rounded-lg text-slate-400 focus-visible:outline-2 focus-visible:outline-emerald-500"><X aria-hidden="true" size={14} /></button></div>}
    {deletedTasks.length > 0 && <div data-delete-undo onMouseEnter={() => setUndoPaused(true)} onMouseLeave={resumeUndoTimer} onFocus={() => setUndoPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) resumeUndoTimer(); }} className="flex max-w-full flex-wrap items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-xs text-slate-900 shadow-xl dark:border-white/15 dark:bg-[#171b23] dark:text-zinc-100"><span role="status">{lang === 'ar' ? (deletedTasks.length === 1 ? 'تم حذف المهمة' : `تم حذف ${deletedTasks.length} من المهام`) : (deletedTasks.length === 1 ? 'Task deleted' : `${deletedTasks.length} tasks deleted`)}</span><button type="button" onClick={handleUndoDeletion} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 font-semibold text-emerald-700 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-emerald-300"><Undo2 aria-hidden="true" size={14} />{lang === 'ar' ? 'تراجع' : 'Undo'}</button><button type="button" aria-label={lang === 'ar' ? 'إغلاق رسالة التراجع' : 'Dismiss undo'} onClick={() => { setDeletedTasks([]); setUndoPaused(false); }} className="flex h-9 w-7 items-center justify-center rounded-lg text-slate-400 focus-visible:outline-2 focus-visible:outline-emerald-500"><X aria-hidden="true" size={14} /></button></div>}
    {toastMessage && <div role="status" className="flex max-w-full items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-xl dark:border-white/15 dark:bg-[#121319] dark:text-zinc-100">{toastSuccess ? <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-500" /> : <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-500" />}<span>{toastMessage}</span>{toastAction && <button type="button" onClick={toastAction.onClick} className="min-h-9 rounded-lg px-2 font-bold text-emerald-700 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-emerald-300">{toastAction.label}</button>}</div>}
  </div>;

  if (page === 'admin' && !support && hasPermission(currentUser.role, 'users.read')) return (
    <React.Suspense fallback={
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-zinc-400">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span className="text-xs font-medium">{lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…'}</span>
      </div>
    }>
      <AdminPanel currentUser={currentUser} lang={lang} onClose={() => navigate('settings')} onImpersonate={(user, token) => { beginSupportSession(user, token); location.hash = ''; location.reload(); }} />
    </React.Suspense>
  );

  if (page === 'settings' && !support) return <>
    <SettingsPage currentUser={currentUser} lang={lang} theme={theme} archiveDaysCount={archiveDays.length} exporting={isExportingImage || exportRequested}
      onBack={() => navigate('planner')} onToggleLang={handleToggleLang} onSetTheme={next => { setStoredTheme(next); setTheme(next); }}
      onResetData={handleResetData} onApply24HourTemplate={handleApply24HourTemplate}
      onSyncComplete={() => { setTasks(getDayRecord(currentDate).tasks); refreshArchive(); }}
      onOpenStats={() => navigate('statistics')} onOpenArchive={() => navigate('archive')} onOpenAdmin={() => navigate('admin')}
      onExport={() => { setExportRequested(true); navigate('planner'); }} onLogout={handleLogout}
      onReplayTour={() => { navigate('planner'); setIsOnboardingOpen(true); }} />
    {feedback}
  </>;

  if ((page === 'statistics' || page === 'archive') && !support) return <>
    <AccountPage key={page} lang={lang} title={page === 'statistics' ? (lang === 'ar' ? 'الإحصائيات والتقرير الأسبوعي' : 'Weekly statistics') : (lang === 'ar' ? 'الأرشيف وسجل الأيام' : 'Archive & history')}
      description={page === 'statistics' ? (lang === 'ar' ? 'راجع إنجازك وعاداتك خلال الأسبوع.' : 'Review your progress and habits for the week.') : (lang === 'ar' ? 'أيامك السابقة محفوظة هنا، اختر يومًا للعودة إليه.' : 'Your previous days, ready to revisit.')}
      onBack={() => navigate('settings')} backLabel={lang === 'ar' ? 'الإعدادات' : 'Settings'}>
      {page === 'statistics' ? <WeeklyReview lang={lang} onNavigateToDay={handleOpenInDaily} /> : <Archive days={archiveDays} lang={lang} onOpenInDaily={handleOpenInDaily} />}
    </AccountPage>{feedback}
  </>;

  return (
    <div className={`relative isolate min-h-screen bg-slate-50 dark:bg-[#07080b] bg-mesh text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200`}>
      {supportBanner}
      {(isExportingImage || exportRequested) && <ScreenshotLoadingScreen lang={lang} theme={theme} />}

      {/* Main Full-Width Centered Clean Canvas */}
      <main
        id="daily-track-container"
        className="relative z-10 isolate flex-1 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 bg-slate-50 dark:bg-[#07080b] bg-mesh transition-colors"
      >
        <PlannerBackdrop />
        <div className="relative z-10 space-y-2 sm:space-y-3">

          {/* Daily actions and quick appearance preferences. */}
          {!support ? <MainHeader
            cardColumns={cardColumns} onToggleCardColumns={toggleCardColumns}
            dateNavigation={<DateNavigation currentDate={currentDate} onDateChange={setCurrentDate} lang={lang} />}
            onDateChange={setCurrentDate}
            currentDate={currentDate}
            currentUser={currentUser}
            onOpenAddTask={() => setIsTaskDestinationOpen(true)}
            onOpenSettings={() => navigate('settings')}
            lang={lang}
            theme={theme}
            onExport={() => { void handleExportDailyTrackImage(); }}
            onOpenArchive={() => navigate('archive')}
            onOpenStats={() => navigate('statistics')}
            onLogout={handleLogout}
            exporting={isExportingImage || exportRequested}
            onToggleLang={handleToggleLang}
            onToggleTheme={() => { const next = theme === 'dark' ? 'light' : 'dark'; setStoredTheme(next); setTheme(next); }}
            dayMemories={<DayMemories key={`${currentUser.id}-${currentDate}`} date={currentDate} lang={lang} onSaved={refreshArchive} />}
            quickNotes={<QuickNotes lang={lang} />}
          >{
            religiousSection === 'prayers' ? (
              <TodayProgress stats={stats} currentFilter={currentFilter} onFilterChange={setCurrentFilter} lang={lang} theme={theme} compact />
            ) : null
          }</MainHeader> : <h1 className="text-xl font-bold"><bdi>{currentUser.name || currentUser.username}</bdi></h1>}
          {support && <DateNavigation currentDate={currentDate} onDateChange={setCurrentDate} lang={lang} />}

          {/* Today Progress Section (bar & metrics) */}
          {support && <div id="onboarding-today-progress">
            <TodayProgress
              stats={stats}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              lang={lang}
               theme={theme}
            />
          </div>}

          <div id="onboarding-planner-area" className="space-y-4 pt-2 sm:space-y-6 sm:pt-3">
            {religiousSection !== 'prayers' && <div className="religious-content-switch" key={religiousSection}>
              <div className="mb-3 flex justify-center">
                <ReligiousTabs active={religiousSection} onChange={setReligiousSection} />
              </div>
              {religiousSection === 'morning' && <MorningAdhkarIslamBook date={currentDate} />}
              {religiousSection === 'evening' && <EveningAdhkarIslamBook date={currentDate} />}
              {religiousSection === 'quran' && (
                <ComingSoonFeature
                  title="الورد القرآني الميسّر"
                  badge="ميزة قيد التطوير"
                  subtitle="قراءة، تدبر، وحفظ الورد اليومي برسم المصحف الشريف"
                  description="يجري العمل على بناء تجربة قراءة وتدبر فاخرة برسم مصحف المدينة المنورة، مع عداد صفحات ذكي، حفظ تلقائي للموضع، وإحصائيات إنجاز متقدمة ترتبط بيومك بانسيابية."
                  features={[
                    'عرض صفحات المصحف الشريف بدقة عالية',
                    'تثبيت مواضع الحفظ والتلاوة اليومية',
                    'تحديد هدف الصفحات اليومي وتتبعه بدقة',
                    'خط مصحف مجمع الملك فهد الأصيل'
                  ]}
                  icon={BookOpen}
                />
              )}
              {religiousSection === 'duas' && (
                <ComingSoonFeature
                  title="موسوعة الأدعية والأذكار الجامعة"
                  badge="ميزة قيد التطوير"
                  subtitle="أدعية القرآن والسنة النبوية الصحيحة مصنفة ومحققة"
                  description="نعمل على إعداد مكتبة أدعية جامعة ومفهرسة تشمل أدعية الرزق، تفريج الهم، الوالدين، الاستخارة، وأدعية الأنبياء، مع إمكانية البحث والنسخ والمشاركة الأنيقة."
                  features={[
                    'أدعية مأثورة ومحققة بالسند الموثق',
                    'تصنيف موضوعي سريع للوصول السهل',
                    'قائمة للأدعية المفضلة وحفظ الملاحظات',
                    'مشاركة الأدعية ببطاقات وتصاميم راقية'
                  ]}
                  icon={HandHeart}
                />
              )}
            </div>}
            {religiousSection === 'prayers' && <>
            <div className="flex flex-wrap items-center justify-between gap-3"><div id="onboarding-view-switcher" role="group" aria-label={lang === 'ar' ? 'طريقة عرض المهام' : 'Planning view'} className="inline-flex max-w-full gap-1 rounded-2xl border border-slate-200 bg-slate-100/70 p-1 dark:border-white/[0.08] dark:bg-white/[0.03]">
              {(['cards', 'timeline'] as const).map(view => {
                const Icon = view === 'cards' ? LayoutGrid : ListChecks;
                const label = view === 'cards' ? (lang === 'ar' ? 'البطاقات' : 'Cards') : (lang === 'ar' ? 'الجدول' : 'Timeline');
                return <button key={view} type="button" aria-pressed={workspace.view === view} onClick={() => handleChangeView(view)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors ${workspace.view === view ? 'bg-white text-emerald-700 shadow-2xs dark:bg-[#1c2425] dark:text-emerald-300' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100'}`}><Icon className="h-4 w-4" />{label}</button>;
              })}
            </div>{!support && <button type="button" onClick={handleMoveRemaining} disabled={!tasks.some(canMoveTask)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-600 hover:border-emerald-500/40 focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:opacity-40 dark:border-white/10 dark:bg-white/[.02] dark:text-zinc-300"><CalendarArrowUp aria-hidden="true" size={15} />{lang === 'ar' ? 'نقل غير المكتمل لليوم التالي' : 'Move unfinished to next day'}</button>}</div>

            <fieldset disabled={!!support} className="min-w-0 border-0 p-0 m-0">
            {workspace.view === 'cards' ? <CardsDashboard religiousNavigation={<ReligiousTabs active={religiousSection} onChange={setReligiousSection} />} cardColumns={cardColumns} currentDate={currentDate} archiveDays={archiveDays} tasks={tasks} workspace={support ? { ...workspace, categories: workspace.categories.map(c => ({ ...c, collapsed: false })) } : workspace} lang={lang} theme={theme} filter={currentFilter} onFilterChange={setCurrentFilter}
              creationTarget={cardCreationTarget}
              onOpenAddTask={() => setIsTaskDestinationOpen(true)}
              onAdd={(title, categoryId) => { handleAddTask({ title, categoryId, time: '', status: 'pending' }); setCurrentFilter('all'); }}
              onAddPrayer={handleCompletePrayer}
              onStatusChange={handlePrayerStatusChange} onEdit={support ? () => {} : setEditingTask} onDelete={handleDeleteTask} onDeleteCategory={handleDeleteCategory} onMove={id => handleMoveTasks([id])} /> : <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><h2 className="text-lg font-bold tracking-tight">{lang === 'ar' ? 'جدولك اليومي' : 'Your daily schedule'}</h2></div>
              {!support && <button type="button" onClick={() => setIsAddTaskOpen(true)} title={lang === 'ar' ? 'إضافة مهمة بوقت محدد إلى الجدول' : 'Add a scheduled task to the timeline'} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold transition-colors hover:border-emerald-400 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-emerald-400/40"><Plus aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />{lang === 'ar' ? 'مهمة بوقت محدد' : 'Scheduled task'}</button>}
            </div>
            <PrayerCard currentDate={currentDate} slots={partitionPrayerTasks(tasks).slots} lang={lang} onAddPrayer={handleCompletePrayer} onStatusChange={handlePrayerStatusChange} />
            <TaskList
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onEdit={(task) => { if (!support) setEditingTask(task); }}
              onDelete={handleDeleteTask}
              onMove={id => handleMoveTasks([id])}
              onUpdateTitle={handleUpdateTaskTitle}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
              onApply24HourTemplate={handleApply24HourTemplate}
              onOpenExportModal={handleExportDailyTrackImage}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              lang={lang}
            /></div>}
          </fieldset>
            </>}
          </div>


        </div>
      </main>

      {/* Add Task Modal */}
      {isTaskDestinationOpen && <TaskDestinationDialog lang={lang} cards={getTaskCardCategories(tasks, workspace, true)}
        onClose={() => setIsTaskDestinationOpen(false)} onTimeline={handleCreateInTimeline}
        onCards={() => handleChangeView('cards')} onCard={handleCreateInCard} />}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAdd={handleAddTask}
        lang={lang}
        defaultTime="08:00"
        categories={activeCategories(workspace)}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        lang={lang}
        categories={activeCategories(workspace)}
      />

      {/* Export Schedule as Image Modal */}
      <ExportScheduleModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tasks={tasks}
        date={currentDate}
        stats={stats}
        dayNote={getDayRecord(currentDate)?.dayNote}
        lang={lang}
      />

      {/* Interactive Onboarding Tour */}
      {isOnboardingOpen && !support && (
        <OnboardingTour
          isOpen={isOnboardingOpen}
          lang={lang}
          theme={theme}
          currentTasksCount={tasks.length}
          onOpenAddTask={() => setIsTaskDestinationOpen(true)}
          onClose={(skipped) => {
            saveOnboardingStatus({ completed: true, skipped });
            setIsOnboardingOpen(false);
          }}
        />
      )}

      {/* Toast Feedback */}
      {feedback}

    </div>
  );
}




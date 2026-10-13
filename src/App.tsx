import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  getTodayDateString 
} from './utils/date';
import { 
  getDayRecord, 
  loadAllDays,
  addTaskToDay, 
  updateTaskInDay, 
  deleteTaskFromDay, 
  getAllArchiveDays, 
  resetToDefaults,
  getStoredTheme,
  setStoredTheme,
  apply24HourTemplate,
} from './utils/storage';

import { triggerSync } from './services/syncEngine';
import { enqueue } from './services/syncQueue';
import { userStorage } from './utils/scopedStorage';
import { Language, PlannerView, StatusFilter, Task, TaskStatus, Theme, User } from './types';
import { getStoredAuth, clearStoredAuth } from './utils/auth';
import { LoginScreen } from './components/LoginScreen';
import { AuthLoadingScreen } from './components/AuthLoadingScreen';
import { CardsDashboard } from './components/CardsDashboard';
import { getPlannerWorkspace, readStoredWorkspace, setPlannerView, updatePlannerCategory } from './utils/workspace';
import { activeCategories, UNASSIGNED_CATEGORY } from './shared/workspace';
import { getTaskCardCategories } from './utils/cardCategories';
import { partitionPrayerTasks } from './utils/prayerTasks';
import { calculateDailyProgress } from './utils/dailyProgress';
import { MainHeader } from './components/MainHeader';
import { TodayProgress } from './components/TodayProgress';
import { PrayerCard } from './components/PrayerCard';
import { DateNavigation } from './components/DateNavigation';
import { TaskList } from './components/TaskList';
import { StatsModal } from './components/StatsModal';
import { ArchiveModal } from './components/ArchiveModal';
import { AddTaskModal } from './components/AddTaskModal';
import { TaskDestinationDialog } from './components/TaskDestinationDialog';
import { EditTaskModal } from './components/EditTaskModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportScheduleModal } from './components/ExportScheduleModal';

import { playAchievementSound, playFailureSound } from './utils/soundEffects';
import { CheckCircle2, LayoutGrid, ListChecks } from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredAuth().user);
  const [isPreparingWorkspace, setIsPreparingWorkspace] = useState(() => Boolean(
    getStoredAuth().user && !readStoredWorkspace() && Object.keys(loadAllDays()).length === 0
  ));
  const [workspace, setWorkspace] = useState(getPlannerWorkspace);

  // Navigation & view states
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayDateString());
  const [currentFilter, setCurrentFilter] = useState<StatusFilter>('all');

  // Modals state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isTaskDestinationOpen, setIsTaskDestinationOpen] = useState(false);
  const [cardCreationTarget, setCardCreationTarget] = useState<{ categoryId: string; requestId: number } | null>(null);
  const cardCreationRequest = useRef(0);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tasks for currentDate
  const [tasks, setTasks] = useState<Task[]>([]);
  // Archive days
  const [archiveDays, setArchiveDays] = useState(() => getAllArchiveDays());

  // Apply the active account?s theme to the document.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!currentUser) return;
    let disposed = false;
    const refresh = () => {
      if (disposed) return;
      setWorkspace(getPlannerWorkspace());
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
      if (!disposed) { refresh(); setIsPreparingWorkspace(false); }
    });
    return () => {
      disposed = true;
      clearInterval(interval);
      window.removeEventListener('focus', syncOnFocus);
      window.removeEventListener('mizan:data-synced', refresh);
      window.removeEventListener('mizan:workspace-changed', refresh);
    };
  }, [currentDate, currentUser?.id]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  useEffect(() => {
    if (!currentUser) return;
    setTheme(getStoredTheme());
    setLang(userStorage.getItem('lang') === 'en' ? 'en' : 'ar');
  }, [currentUser?.id]);

  const refreshArchive = useCallback(() => {
    setArchiveDays(getAllArchiveDays());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'; setStoredTheme(next); setTheme(next);
  };

  // Handlers
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (newStatus === 'done') {
      playAchievementSound();
    } else if (newStatus === 'not-done') {
      playFailureSound();
    }

    updateTaskInDay(currentDate, taskId, { status: newStatus });
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
  };

  const handleAddTask = (taskInput: { title: string; time: string; status: TaskStatus; notes?: string; categoryId?: string }) => {
    addTaskToDay(currentDate, taskInput);
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
    showToast(lang === 'ar' ? 'تمت إضافة المهمة بنجاح' : 'Task added successfully');
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    const existing = tasks.find((t) => t.id === taskId);
    if (updates.status && updates.status !== existing?.status) {
      if (updates.status === 'done') {
        playAchievementSound();
      } else if (updates.status === 'not-done') {
        playFailureSound();
      }
    }

    updateTaskInDay(currentDate, taskId, updates);
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
    showToast(lang === 'ar' ? 'تم حفظ التعديل' : 'Changes saved');
  };

  const handleUpdateTaskTitle = (taskId: string, newTitle: string) => {
    updateTaskInDay(currentDate, taskId, { title: newTitle });
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
    if (newTitle.trim()) {
      showToast(lang === 'ar' ? `تم تحديد: ${newTitle}` : `Saved: ${newTitle}`);
    }
  };

  const handleApply24HourTemplate = () => {
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
    deleteTaskFromDay(currentDate, taskId);
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    refreshArchive();
    showToast(lang === 'ar' ? 'تم حذف المهمة' : 'Task deleted');
  };

  const handleOpenInDaily = (date: string) => {
    setCurrentDate(date);
    setIsArchiveModalOpen(false);
    setIsStatsModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompletePrayer = (title: string, time: string) => {
    handleAddTask({ title, categoryId: 'worship', time, status: 'done' });
    playAchievementSound();
    setCurrentFilter('all');
  };

  const handleToggleLang = () => {
    const next = lang === 'ar' ? 'en' : 'ar';
    userStorage.setItem('lang', next);
    enqueue('settings', { lang: next });
    setLang(next);
  };

  const handleResetData = () => {
    resetToDefaults();
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
    showToast(lang === 'ar' ? 'تم مسح المهام وإعادة ضبط العادات لهذا الحساب' : 'Tasks cleared and habits reset for this account');
  };

  const handleChangeView = (view: PlannerView) => {
    setCardCreationTarget(null);
    setWorkspace(setPlannerView(view));
    setCurrentFilter('all');
  };

  const handleCreateInTimeline = () => {
    handleChangeView('timeline');
    setIsTaskDestinationOpen(false);
    setIsAddTaskOpen(true);
  };

  const handleCreateInCard = (categoryId: string) => {
    const category = activeCategories(getPlannerWorkspace()).find(card => card.id === categoryId);
    if (!category && categoryId !== UNASSIGNED_CATEGORY) return;
    handleChangeView('cards');
    if (category?.collapsed) setWorkspace(updatePlannerCategory(categoryId, { collapsed: false }));
    setCardCreationTarget({ categoryId, requestId: ++cardCreationRequest.current });
    setIsTaskDestinationOpen(false);
  };

  const stats = useMemo(() => calculateDailyProgress(tasks), [tasks]);

  const [isExportingImage, setIsExportingImage] = useState(false);

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

  const handleLogout = () => {
    clearStoredAuth();
    setTasks([]);
    setArchiveDays([]);
    setIsSettingsOpen(false);
    setIsStatsModalOpen(false);
    setIsArchiveModalOpen(false);
    setIsAddTaskOpen(false);
    setIsTaskDestinationOpen(false);
    setCardCreationTarget(null);
    setEditingTask(null);
    setIsExportModalOpen(false);
    setIsPreparingWorkspace(false);
    setCurrentUser(null);
    showToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
  };

  // If user is not authenticated, show Lock / Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          // The initial sync effect dismisses the loader after preparing account data.
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
    return <AuthLoadingScreen stage="preparing" lang={lang} theme={theme} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#07080b] bg-mesh text-slate-900 dark:text-zinc-100 flex flex-col font-['Alexandria','Cairo',sans-serif] transition-colors duration-200`}>
      
      {/* Main Full-Width Centered Clean Canvas */}
      <main 
        id="daily-track-container" 
        className={`flex-1 w-full ${workspace.view === 'cards' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 bg-slate-50 dark:bg-[#07080b] bg-mesh transition-colors`}
      >
        <div className="space-y-4 sm:space-y-6">
          
          {/* Main Header with clean icons: Profile (with Stats & Archive), Settings, Theme, Export, + Add Task */}
          <MainHeader
            currentDate={currentDate}
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenAddTask={() => setIsTaskDestinationOpen(true)}
            onOpenExportModal={handleExportDailyTrackImage}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenStats={() => setIsStatsModalOpen(true)}
            onOpenArchive={() => setIsArchiveModalOpen(true)}
            archiveDaysCount={archiveDays.length}
            lang={lang}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />

          {/* Today Progress Section (bar & metrics) */}
          <TodayProgress
            stats={stats}
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
            lang={lang}
          />

          {/* Date Navigation (Previous Day, Today, Next Day) */}
          <DateNavigation
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            lang={lang}
          />

          <div role="group" aria-label={lang === 'ar' ? 'طريقة عرض المهام' : 'Planning view'} className="inline-flex max-w-full gap-1 rounded-2xl border border-slate-200 bg-slate-100/70 p-1 dark:border-white/[0.08] dark:bg-white/[0.03]">
            {(['cards', 'timeline'] as const).map(view => {
              const Icon = view === 'cards' ? LayoutGrid : ListChecks;
              const label = view === 'cards' ? (lang === 'ar' ? 'البطاقات' : 'Cards') : (lang === 'ar' ? 'الجدول الزمني' : 'Timeline');
              return <button key={view} type="button" aria-pressed={workspace.view === view} onClick={() => handleChangeView(view)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors ${workspace.view === view ? 'bg-white text-emerald-700 shadow-2xs dark:bg-[#1c2425] dark:text-emerald-300' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100'}`}><Icon className="h-4 w-4" />{label}</button>;
            })}
          </div>

          {workspace.view === 'cards' ? <CardsDashboard currentDate={currentDate} tasks={tasks} workspace={workspace} lang={lang} filter={currentFilter} onFilterChange={setCurrentFilter}
            creationTarget={cardCreationTarget}
            onAdd={(title, categoryId) => { handleAddTask({ title, categoryId, time: '', status: 'pending' }); setCurrentFilter('all'); }}
            onAddPrayer={handleCompletePrayer}
            onStatusChange={handleStatusChange} onEdit={setEditingTask} onDelete={handleDeleteTask} /> : <>
            <PrayerCard currentDate={currentDate} slots={partitionPrayerTasks(tasks).slots} lang={lang} onAddPrayer={handleCompletePrayer} onStatusChange={handleStatusChange} onEdit={setEditingTask} onDelete={handleDeleteTask} />
            <TaskList
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEdit={(task) => setEditingTask(task)}
            onDelete={handleDeleteTask}
            onUpdateTitle={handleUpdateTaskTitle}
            onOpenAddTask={() => setIsAddTaskOpen(true)}
            onApply24HourTemplate={handleApply24HourTemplate}
            onOpenExportModal={handleExportDailyTrackImage}
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
            lang={lang}
          /></>}

        </div>
      </main>

      {/* Dedicated Statistics Modal (Accessed via Profile Icon in Header) */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        lang={lang}
        onNavigateToDay={handleOpenInDaily}
      />

      {/* Dedicated Archive Modal (Accessed via Profile Icon in Header) */}
      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        days={archiveDays}
        lang={lang}
        onOpenInDaily={handleOpenInDaily}
      />

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

      {/* Settings Modal (Accessed via Settings Icon in Header) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        onToggleLang={handleToggleLang}
        onResetData={handleResetData}
        onApply24HourTemplate={handleApply24HourTemplate}
        theme={theme}
        onSetTheme={(next) => { setStoredTheme(next); setTheme(next); }}
        onSyncComplete={() => { setTasks(getDayRecord(currentDate).tasks); refreshArchive(); }}
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

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#121319] border border-slate-300 dark:border-white/[0.15] text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-2xl shadow-xl animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

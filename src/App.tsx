import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getTodayDateString 
} from './utils/date';
import { 
  getDayRecord, 
  addTaskToDay, 
  updateTaskInDay, 
  deleteTaskFromDay, 
  calculateStats, 
  getAllArchiveDays, 
  resetToDefaults,
  getStoredTheme,
  setStoredTheme,
  apply24HourTemplate,
} from './utils/storage';

import { triggerSync } from './services/syncEngine';
import { enqueue } from './services/syncQueue';
import { userStorage } from './utils/scopedStorage';
import { Language, StatusFilter, Task, TaskStatus, Theme, User } from './types';
import { getStoredAuth, clearStoredAuth } from './utils/auth';
import { LoginScreen } from './components/LoginScreen';
import { MainHeader } from './components/MainHeader';
import { TodayProgress } from './components/TodayProgress';
import { PrayerTimesWidget } from './components/PrayerTimesWidget';
import { DateNavigation } from './components/DateNavigation';
import { TaskList } from './components/TaskList';
import { StatsModal } from './components/StatsModal';
import { ArchiveModal } from './components/ArchiveModal';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportScheduleModal } from './components/ExportScheduleModal';

import { playAchievementSound, playFailureSound } from './utils/soundEffects';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredAuth().user);

  // Navigation & view states
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayDateString());
  const [currentFilter, setCurrentFilter] = useState<StatusFilter>('all');

  // Modals state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
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
      setTasks(getDayRecord(currentDate).tasks);
      setArchiveDays(getAllArchiveDays());
      setTheme(getStoredTheme());
      setLang(userStorage.getItem('lang') === 'en' ? 'en' : 'ar');
    };
    refresh();
    window.addEventListener('mizan:data-synced', refresh);
    const syncOnFocus = () => { void triggerSync(currentUser.id, true); };
    window.addEventListener('focus', syncOnFocus);
    const interval = setInterval(syncOnFocus, 30000);
    void triggerSync(currentUser.id, true);
    return () => {
      disposed = true;
      clearInterval(interval);
      window.removeEventListener('focus', syncOnFocus);
      window.removeEventListener('mizan:data-synced', refresh);
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

  const handleAddTask = (taskInput: { title: string; time: string; status: TaskStatus; notes?: string }) => {
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

  const handleQuickAddPrayer = (title: string, time: string) => {
    const targetSlot = tasks.find((t) => t.time === time && !t.title.trim());

    if (targetSlot) {
      handleUpdateTask(targetSlot.id, {
        title,
        category: 'worship',
        status: targetSlot.status || 'pending',
      });
      showToast(lang === 'ar' ? `تم إدراج ${title} في الساعة ${time}` : `Scheduled ${title} at ${time}`);
    } else {
      handleAddTask({
        title,
        time,
        status: 'pending',
      });
    }
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

  const stats = useMemo(() => calculateStats(tasks), [tasks]);

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
    setEditingTask(null);
    setIsExportModalOpen(false);
    setCurrentUser(null);
    showToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
  };

  // If user is not authenticated, show Lock / Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(lang === 'ar' ? `أهلاً بك، ${user.name || user.username}!` : `Welcome, ${user.name || user.username}!`);
        }}
        lang={lang}
        theme={theme}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#07080b] bg-mesh text-slate-900 dark:text-zinc-100 flex flex-col font-['Alexandria','Cairo',sans-serif] transition-colors duration-200`}>
      
      {/* Main Full-Width Centered Clean Canvas */}
      <main 
        id="daily-track-container" 
        className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 bg-slate-50 dark:bg-[#07080b] bg-mesh transition-colors"
      >
        <div className="space-y-4 sm:space-y-6">
          
          {/* Main Header with clean icons: Profile (with Stats & Archive), Settings, Theme, Export, + Add Task */}
          <MainHeader
            currentDate={currentDate}
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenAddTask={() => setIsAddTaskOpen(true)}
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

          {/* Automated Prayer Times Widget */}
          <PrayerTimesWidget
            currentDate={currentDate}
            lang={lang}
            onAddTaskToSchedule={handleQuickAddPrayer}
            todayTasks={tasks}
          />

          {/* Date Navigation (Previous Day, Today, Next Day) */}
          <DateNavigation
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            lang={lang}
          />

          {/* Always Displayed: Today's 24-Hour Tasks Section */}
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
          />

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
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAdd={handleAddTask}
        lang={lang}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        lang={lang}
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

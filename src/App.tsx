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
  loadAllDays,
  getStoredHabits,
  saveAllDays,
} from './utils/storage';
import { checkDbHealth, fetchAllDaysFromDb, fetchDayFromDb, resetDatabaseToSaturday26 } from './services/api';
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
import { exportDailyTrackToImage } from './utils/exportDailyTrack';
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

  // Apply theme to document element and persist in localStorage
  useEffect(() => {
    setStoredTheme(theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Initial MongoDB Atlas sync and health check on mount
  useEffect(() => {
    async function initCloudSync() {
      try {
        const health = await checkDbHealth();
        if (health.connected) {
          const dbDays = await fetchAllDaysFromDb();
          const hasOldData = Object.keys(dbDays).some((d) => d < '2026-09-26');
          
          const remoteSaturday = dbDays['2026-09-26'];
          const remoteHasTasks = remoteSaturday && remoteSaturday.tasks && remoteSaturday.tasks.some((t: any) => t.title && t.title.trim() !== '');

          if (hasOldData || !remoteHasTasks) {
            // Force sync Saturday 26 schedule to MongoDB Atlas
            const saturdayRec = getDayRecord('2026-09-26');
            await resetDatabaseToSaturday26(saturdayRec, getStoredHabits());
          } else {
            const localDays = loadAllDays();
            // Filter out any keys older than 2026-09-26
            const cleanDbDays: Record<string, any> = {};
            for (const [k, v] of Object.entries(dbDays)) {
              if (k >= '2026-09-26') cleanDbDays[k] = v;
            }
            const merged = { ...localDays, ...cleanDbDays };
            saveAllDays(merged);
            const currentRec = getDayRecord(currentDate);
            setTasks(currentRec.tasks);
            setArchiveDays(getAllArchiveDays());
          }
        }
      } catch (err) {
        console.warn('Initial MongoDB sync warning:', err);
      }
    }

    initCloudSync();
  }, []);

  // Load tasks on date or language change
  useEffect(() => {
    const record = getDayRecord(currentDate);
    setTasks(record.tasks);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Also fetch latest from MongoDB in background
    fetchDayFromDb(currentDate).then((remoteRecord) => {
      if (remoteRecord && remoteRecord.tasks && remoteRecord.tasks.length > 0) {
        const local = loadAllDays();
        const currentLocal = local[currentDate];
        const remoteHasContent = remoteRecord.tasks.some((t) => t.title && t.title.trim() !== '');
        const localHasContent = currentLocal?.tasks?.some((t) => t.title && t.title.trim() !== '');

        if (remoteHasContent || !localHasContent) {
          local[currentDate] = remoteRecord;
          saveAllDays(local);
          setTasks(remoteRecord.tasks);
        }
      }
    }).catch(() => {});
  }, [currentDate, lang]);

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
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Handlers
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (newStatus === 'done') {
      playAchievementSound();
    } else if (newStatus === 'not-done') {
      playFailureSound();
    }

    updateTaskInDay(currentDate, taskId, { status: newStatus });
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    refreshArchive();
  };

  const handleAddTask = (taskInput: { title: string; time: string; status: TaskStatus; notes?: string }) => {
    addTaskToDay(currentDate, taskInput);
    const updatedRecord = getDayRecord(currentDate);
    setTasks(updatedRecord.tasks);
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
    const updatedRecord = getDayRecord(currentDate);
    setTasks(updatedRecord.tasks);
    refreshArchive();
    showToast(lang === 'ar' ? 'تم حفظ التعديل' : 'Changes saved');
  };

  const handleUpdateTaskTitle = (taskId: string, newTitle: string) => {
    updateTaskInDay(currentDate, taskId, { title: newTitle });
    const updatedRecord = getDayRecord(currentDate);
    setTasks(updatedRecord.tasks);
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
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
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
    const hourPrefix = time.split(':')[0] + ':00';
    const targetSlot = tasks.find((t) => t.time === hourPrefix);

    if (targetSlot) {
      handleUpdateTask(targetSlot.id, {
        title,
        category: 'worship',
        status: targetSlot.status || 'pending',
      });
      showToast(lang === 'ar' ? `تم إدراج ${title} في جدول الساعة ${hourPrefix}` : `Scheduled ${title} at ${hourPrefix}`);
    } else {
      handleAddTask({
        title,
        time,
        status: 'pending',
      });
    }
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleResetData = () => {
    resetToDefaults();
    const rec = getDayRecord('2026-09-26');
    setCurrentDate('2026-09-26');
    setTasks(rec.tasks);
    refreshArchive();
    resetDatabaseToSaturday26(rec, getStoredHabits()).catch(() => {});
    showToast(lang === 'ar' ? 'تم تصفير البيانات والبدء من السبت 26 سبتمبر من الصفر' : 'Data reset to Saturday 26 from scratch');
  };

  const stats = useMemo(() => calculateStats(tasks), [tasks]);

  const [isExportingImage, setIsExportingImage] = useState(false);

  const handleExportDailyTrackImage = async () => {
    if (isExportingImage) return;
    try {
      setIsExportingImage(true);
      showToast(
        lang === 'ar' 
          ? '⏳ جارٍ تصدير لوحة Daily Track كاملة كصورة فائقة الدقة...' 
          : '⏳ Exporting full Daily Track high-res image...'
      );
      
      await exportDailyTrackToImage({
        elementId: 'daily-track-container',
        fileName: `Daily-Track-${currentDate}.png`,
        theme,
      });

      showToast(
        lang === 'ar' 
          ? '✓ تم تصدير وحفظ صورة Daily Track كاملة بنجاح!' 
          : '✓ Full Daily Track image saved successfully!'
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
        onSetTheme={setTheme}
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

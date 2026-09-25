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
import { checkDbHealth, fetchAllDaysFromDb, fetchDayFromDb, migrateLocalDataToMongo, resetDatabaseToSaturday26 } from './services/api';
import { ActiveTab, Language, StatusFilter, Task, TaskStatus, Theme } from './types';
import { Sidebar } from './components/Sidebar';
import { MainHeader } from './components/MainHeader';
import { TodayProgress } from './components/TodayProgress';
import { PrayerTimesWidget } from './components/PrayerTimesWidget';
import { DateNavigation } from './components/DateNavigation';
import { TaskList } from './components/TaskList';
import { Archive } from './components/Archive';
import { WeeklyReview } from './components/WeeklyReview';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportScheduleModal } from './components/ExportScheduleModal';
import { exportDailyTrackToImage } from './utils/exportDailyTrack';
import { playAchievementSound, playFailureSound, playPendingSound } from './utils/soundEffects';
import { MobileNav } from './components/MobileNav';
import { MobileDrawer } from './components/MobileDrawer';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Navigation & view states
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayDateString());
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [currentFilter, setCurrentFilter] = useState<StatusFilter>('all');

  // Modals & Drawer state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
    // Play achievement audio for completed tasks or failure audio for not done
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
    setActiveTab('daily');
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
          ? '⏳ جارٍ تصدير لوحة Daily Track كاملة كصورة فائقة الدقة (2.5x)...' 
          : '⏳ Exporting full Daily Track high-res image (2.5x)...'
      );
      
      await exportDailyTrackToImage({
        elementId: 'daily-track-container',
        fileName: `Daily-Track-${currentDate}.png`,
        theme,
      });

      showToast(
        lang === 'ar' 
          ? '✓ تم تصدير وحفظ صورة Daily Track كاملة حتى آخر مهمة بنجاح!' 
          : '✓ Full Daily Track image saved successfully down to the last task!'
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

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#07080b] bg-mesh text-slate-900 dark:text-zinc-100 flex flex-col md:flex-row font-['Alexandria','Cairo',sans-serif] transition-colors duration-200`}>
      
      {/* Desktop Sticky Minimal Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          todayTasksCount={tasks.length}
          archiveDaysCount={archiveDays.length}
          onOpenSettings={() => setIsSettingsOpen(true)}
          lang={lang}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      </div>

      {/* Main Content Area - Fully responsive with safe padding for mobile bottom bar */}
      <main 
        id="daily-track-container" 
        className="flex-1 min-h-screen flex flex-col max-w-4xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-10 pb-28 md:pb-12 bg-slate-50 dark:bg-[#07080b] bg-mesh transition-colors"
      >
        
        {activeTab === 'daily' ? (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Main Header (Greeting, Date, Quick Theme Toggle, Export Image, + Add Task, Hamburger for Mobile) */}
            <MainHeader
              currentDate={currentDate}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
              onOpenExportModal={handleExportDailyTrackImage}
              onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
              lang={lang}
              theme={theme}
              onToggleTheme={handleToggleTheme}
            />

            {/* Today Progress Section (Responsive bar & metrics) */}
            <TodayProgress
              stats={stats}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              lang={lang}
            />

            {/* Official Automated Prayer Times Widget */}
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

            {/* Tasks Section */}
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
        ) : activeTab === 'stats' ? (
          <WeeklyReview
            lang={lang}
            onNavigateToDay={handleOpenInDaily}
          />
        ) : (
          /* Archive View */
          <Archive
            days={archiveDays}
            onOpenInDaily={handleOpenInDaily}
            lang={lang}
          />
        )}

      </main>

      {/* Mobile Slide-Over Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        todayTasksCount={tasks.length}
        archiveDaysCount={archiveDays.length}
        onOpenTemplates={() => setIsSettingsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lang={lang}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Mobile Fixed Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddTask={() => setIsAddTaskOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lang={lang}
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

      {/* Settings Modal with Theme & Language options */}
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

      {/* Subtle Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#121319] border border-slate-300 dark:border-white/[0.15] text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-2xl shadow-xl animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

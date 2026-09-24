import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getTodayDateString 
} from './utils/date';
import { 
  getDayRecord, 
  addTaskToDay, 
  updateTaskInDay, 
  deleteTaskFromDay, 
  restoreTaskToDay,
  calculateStats, 
  getAllArchiveDays, 
  resetToDefaults,
  getStoredTheme,
  setStoredTheme,
  applyTemplateToDay,
  getStoredHabits,
  toggleHabitToday,
  getWeeklyStats,
} from './utils/storage';
import { ActiveTab, HabitStreak, Language, StatusFilter, Task, TaskCategory, TaskStatus, Theme, ViewMode } from './types';
import { Sidebar } from './components/Sidebar';
import { MainHeader } from './components/MainHeader';
import { TodayProgress } from './components/TodayProgress';
import { DateNavigation } from './components/DateNavigation';
import { TimelineView } from './components/TimelineView';
import { MobilePeriodView } from './components/MobilePeriodView';
import { WeeklyStats } from './components/WeeklyStats';
import { Archive } from './components/Archive';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { TemplateModal } from './components/TemplateModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportScheduleModal } from './components/ExportScheduleModal';
import { exportDailyTrackToImage } from './utils/exportDailyTrack';
import { playAchievementSound, playFailureSound } from './utils/soundEffects';
import { MobileNav } from './components/MobileNav';
import { MobileDrawer } from './components/MobileDrawer';
import { CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function App() {
  // Navigation & View states
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayDateString());
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [currentFilter, setCurrentFilter] = useState<StatusFilter>('all');

  // Modals & Drawer states
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [quickAddStartTime, setQuickAddStartTime] = useState<string>('08:00');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Undo task deletion state
  const [lastDeletedTask, setLastDeletedTask] = useState<{ task: Task; date: string } | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<any>(null);

  // Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tasks for currentDate
  const [tasks, setTasks] = useState<Task[]>([]);
  // Archive days
  const [archiveDays, setArchiveDays] = useState(() => getAllArchiveDays());
  // Habit streaks
  const [habits, setHabits] = useState<HabitStreak[]>(() => getStoredHabits());

  // Apply theme & RTL direction
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

  // Sync tasks on date or language change
  useEffect(() => {
    const record = getDayRecord(currentDate);
    setTasks(record.tasks);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [currentDate, lang]);

  const refreshArchive = useCallback(() => {
    setArchiveDays(getAllArchiveDays());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Keyboard shortcut: Press 'N' to open Add Task, Ctrl+Z to Undo deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.tagName === 'SELECT';
      if (!isInput && (e.key === 'n' || e.key === 'N') && !isAddTaskOpen && !editingTask && !isSettingsOpen && !isTemplateModalOpen) {
        e.preventDefault();
        setQuickAddStartTime('08:00');
        setIsAddTaskOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && lastDeletedTask) {
        e.preventDefault();
        handleUndoDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddTaskOpen, editingTask, isSettingsOpen, isTemplateModalOpen, lastDeletedTask]);

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

  const handleAddTask = (taskInput: { 
    title: string; 
    time: string; 
    endTime?: string;
    duration?: number;
    status: TaskStatus; 
    notes?: string;
    category?: TaskCategory;
  }) => {
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

  const handleResizeTask = (taskId: string, newDuration: number) => {
    updateTaskInDay(currentDate, taskId, { duration: newDuration });
    const updatedRecord = getDayRecord(currentDate);
    setTasks(updatedRecord.tasks);
  };

  // Delete with UNDO capability
  const handleDeleteTask = (taskId: string) => {
    const deleted = deleteTaskFromDay(currentDate, taskId);
    if (deleted) {
      // Save for undo
      setLastDeletedTask({ task: deleted, date: currentDate });
      if (undoTimeoutId) clearTimeout(undoTimeoutId);
      const timer = setTimeout(() => {
        setLastDeletedTask(null);
      }, 6000);
      setUndoTimeoutId(timer);

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      refreshArchive();
    }
  };

  const handleUndoDelete = () => {
    if (!lastDeletedTask) return;
    restoreTaskToDay(lastDeletedTask.date, lastDeletedTask.task);
    if (lastDeletedTask.date === currentDate) {
      const rec = getDayRecord(currentDate);
      setTasks(rec.tasks);
    }
    refreshArchive();
    if (undoTimeoutId) clearTimeout(undoTimeoutId);
    setLastDeletedTask(null);
    showToast(lang === 'ar' ? 'تم استرجاع المهمة بنجاح' : 'Task restored');
  };

  const handleSelectTemplate = (templateId: string) => {
    const newTasks = applyTemplateToDay(currentDate, templateId);
    setTasks(newTasks);
    refreshArchive();
    showToast(lang === 'ar' ? 'تم تطبيق القالب على جدول اليوم بنجاح' : 'Template applied successfully');
  };

  const handleToggleHabit = (habitId: string) => {
    const updated = toggleHabitToday(habitId, currentDate);
    setHabits(updated);
    playAchievementSound();
    showToast(lang === 'ar' ? 'تم تحديث سلسلة العادة اليوم' : 'Habit streak updated');
  };

  const handleOpenDate = (date: string) => {
    setCurrentDate(date);
    setActiveTab('daily');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleResetData = () => {
    resetToDefaults();
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    setHabits(getStoredHabits());
    refreshArchive();
    showToast(lang === 'ar' ? 'تمت استعادة الجدول الأولي والعادات' : 'Default schedule restored');
  };

  const stats = useMemo(() => calculateStats(tasks), [tasks]);
  const weeklyData = useMemo(() => getWeeklyStats(currentDate), [currentDate, tasks]);

  // Dates that have tasks recorded (for mini calendar dots)
  const hasTasksDates = useMemo(() => {
    return archiveDays.map((d) => d.date);
  }, [archiveDays]);

  const [isExportingImage, setIsExportingImage] = useState(false);

  const handleExportDailyTrackImage = async () => {
    if (isExportingImage) return;
    try {
      setIsExportingImage(true);
      showToast(
        lang === 'ar' 
          ? '⏳ جارٍ تصدير لوحة Daily Track كاملة كصورة عالية الدقة...' 
          : '⏳ Exporting high-res image...'
      );
      
      await exportDailyTrackToImage({
        elementId: 'daily-track-container',
        fileName: `Daily-Track-${currentDate}.png`,
        theme,
      });

      showToast(
        lang === 'ar' 
          ? '✓ تم تصدير وحفظ الصورة بنجاح!' 
          : '✓ Image saved successfully!'
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

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#07080b] bg-mesh text-slate-900 dark:text-zinc-100 flex flex-col md:flex-row font-['Alexandria','Cairo',sans-serif] transition-colors duration-200`}>
      
      {/* Desktop Two-column: Left Sidebar with Mini Calendar, Progress Ring, Filters & Templates */}
      <div className="hidden md:flex h-screen sticky top-0 shrink-0">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stats={stats}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          archiveDaysCount={archiveDays.length}
          onOpenTemplates={() => setIsTemplateModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          lang={lang}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          hasTasksDates={hasTasksDates}
        />
      </div>

      {/* Main Content Viewport: Full-Width Timeline or Periods View */}
      <main 
        id="daily-track-container" 
        className="flex-1 min-h-screen flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-8 py-5 sm:py-8 pb-28 md:pb-12 bg-slate-50 dark:bg-[#07080b] bg-mesh transition-colors"
      >
        
        {/* Main Header (Branding, View Mode Switcher, Date, Actions, Theme Toggle) */}
        <MainHeader
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenAddTask={() => {
            setQuickAddStartTime('08:00');
            setIsAddTaskOpen(true);
          }}
          onOpenExportModal={handleExportDailyTrackImage}
          onPrintPDF={handlePrintPDF}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          lang={lang}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Dynamic Tab Body */}
        <div className="mt-5 space-y-5">
          {activeTab === 'daily' ? (
            <>
              {/* Today's Visual Progress Banner with Circular Ring */}
              <TodayProgress
                stats={stats}
                currentFilter={currentFilter}
                onFilterChange={setCurrentFilter}
                lang={lang}
              />

              {/* Date Navigation (< Previous | Today | Next >) */}
              <DateNavigation
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                lang={lang}
              />

              {/* Schedule Main View: Timeline or Grouped Periods */}
              {viewMode === 'timeline' ? (
                <TimelineView
                  tasks={tasks}
                  onStatusChange={handleStatusChange}
                  onEdit={(t) => setEditingTask(t)}
                  onDelete={handleDeleteTask}
                  onQuickAddTask={(st) => {
                    setQuickAddStartTime(st);
                    setIsAddTaskOpen(true);
                  }}
                  onResizeTask={handleResizeTask}
                  currentFilter={currentFilter}
                  lang={lang}
                />
              ) : (
                <MobilePeriodView
                  tasks={tasks}
                  onStatusChange={handleStatusChange}
                  onEdit={(t) => setEditingTask(t)}
                  onDelete={handleDeleteTask}
                  currentFilter={currentFilter}
                  lang={lang}
                />
              )}
            </>
          ) : activeTab === 'stats' ? (
            /* Weekly Analytics & Habits Streaks */
            <WeeklyStats
              weeklyData={weeklyData}
              habits={habits}
              onToggleHabit={handleToggleHabit}
              onOpenDate={handleOpenDate}
              currentDate={currentDate}
              lang={lang}
            />
          ) : (
            /* Archive History */
            <Archive
              days={archiveDays}
              onOpenInDaily={handleOpenDate}
              lang={lang}
            />
          )}
        </div>

      </main>

      {/* Floating UNDO Deleted Task Toast Banner */}
      {lastDeletedTask && (
        <div className="fixed bottom-20 md:bottom-8 start-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-slate-950 text-white dark:bg-white dark:text-slate-950 border border-slate-700 dark:border-slate-300 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 dark:text-amber-600 shrink-0 stroke-[2.5]" />
          <span className="text-xs font-semibold max-w-[200px] truncate">
            {lang === 'ar' 
              ? `تم حذف: "${lastDeletedTask.task.title || 'مهمة'}"` 
              : `Deleted: "${lastDeletedTask.task.title || 'Task'}"`}
          </span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-lg transition-all active:scale-95 cursor-pointer font-['Alexandria']"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.8]" />
            <span>{lang === 'ar' ? 'تراجع' : 'Undo'}</span>
          </button>
        </div>
      )}

      {/* General Notification Toast */}
      {toastMessage && !lastDeletedTask && (
        <div className="fixed bottom-20 md:bottom-8 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#121319] border border-slate-300 dark:border-white/[0.15] text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-2xl shadow-xl animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        todayTasksCount={tasks.length}
        archiveDaysCount={archiveDays.length}
        onOpenTemplates={() => {
          setIsMobileDrawerOpen(false);
          setIsTemplateModalOpen(true);
        }}
        onOpenSettings={() => {
          setIsMobileDrawerOpen(false);
          setIsSettingsOpen(true);
        }}
        lang={lang}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Mobile Bottom Navigation with Floating FAB */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddTask={() => {
          setQuickAddStartTime('08:00');
          setIsAddTaskOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lang={lang}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAdd={handleAddTask}
        initialStartTime={quickAddStartTime}
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

      {/* Schedule Templates Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        lang={lang}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        onToggleLang={handleToggleLang}
        onResetData={handleResetData}
        theme={theme}
        onSetTheme={setTheme}
      />

      {/* Export Schedule Modal */}
      <ExportScheduleModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tasks={tasks}
        date={currentDate}
        stats={stats}
        dayNote={getDayRecord(currentDate)?.dayNote}
        lang={lang}
      />

    </div>
  );
}

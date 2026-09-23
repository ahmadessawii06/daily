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
  resetToDefaults
} from './utils/storage';
import { Language, StatusFilter, Task, TaskStatus } from './types';
import { Sidebar } from './components/Sidebar';
import { MainHeader } from './components/MainHeader';
import { TodayProgress } from './components/TodayProgress';
import { DateNavigation } from './components/DateNavigation';
import { TaskList } from './components/TaskList';
import { Archive } from './components/Archive';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { SettingsModal } from './components/SettingsModal';
import { MobileNav } from './components/MobileNav';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Navigation & view states
  const [lang, setLang] = useState<Language>('ar');
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayDateString());
  const [activeTab, setActiveTab] = useState<'daily' | 'archive'>('daily');
  const [currentFilter, setCurrentFilter] = useState<StatusFilter>('all');

  // Modals state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tasks for currentDate
  const [tasks, setTasks] = useState<Task[]>([]);
  // Archive days
  const [archiveDays, setArchiveDays] = useState(() => getAllArchiveDays());

  // Load tasks on date or language change
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
    }, 2200);
  };

  // Keyboard shortcut: Press 'N' to open Add Task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.tagName === 'SELECT';
      if (!isInput && (e.key === 'n' || e.key === 'N') && !isAddTaskOpen && !editingTask && !isSettingsOpen) {
        e.preventDefault();
        setIsAddTaskOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddTaskOpen, editingTask, isSettingsOpen]);

  // Handlers
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
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
    showToast(lang === 'ar' ? 'تمت إضافة المهمة' : 'Task added');
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    updateTaskInDay(currentDate, taskId, updates);
    const updatedRecord = getDayRecord(currentDate);
    setTasks(updatedRecord.tasks);
    refreshArchive();
    showToast(lang === 'ar' ? 'تم تحديث المهمة' : 'Task updated');
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

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleResetData = () => {
    resetToDefaults();
    const rec = getDayRecord(currentDate);
    setTasks(rec.tasks);
    refreshArchive();
    showToast(lang === 'ar' ? 'تمت استعادة الجدول الأولي' : 'Seed schedule restored');
  };

  const stats = useMemo(() => calculateStats(tasks), [tasks]);

  return (
    <div className={`min-h-screen bg-[#07080b] text-zinc-100 flex flex-col md:flex-row font-['IBM_Plex_Sans_Arabic',sans-serif]`}>
      
      {/* Desktop Minimal Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          todayTasksCount={tasks.length}
          archiveDaysCount={archiveDays.length}
          onOpenSettings={() => setIsSettingsOpen(true)}
          lang={lang}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 pb-24 md:pb-12">
        
        {activeTab === 'daily' ? (
          <div className="space-y-6">
            
            {/* Main Header (Greeting, Date, + Add Task) */}
            <MainHeader
              currentDate={currentDate}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
              onOpenMobileMenu={() => setIsSettingsOpen(true)}
              lang={lang}
            />

            {/* Today Progress Section */}
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

            {/* Tasks Section */}
            <TaskList
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onEdit={(task) => setEditingTask(task)}
              onDelete={handleDeleteTask}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              lang={lang}
            />

          </div>
        ) : (
          /* Archive View */
          <Archive
            days={archiveDays}
            onOpenInDaily={handleOpenInDaily}
            lang={lang}
          />
        )}

      </div>

      {/* Mobile Bottom Navigation */}
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        onToggleLang={handleToggleLang}
        onResetData={handleResetData}
      />

      {/* Subtle Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-8 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 bg-[#121319] border border-white/[0.1] text-zinc-200 text-xs font-medium rounded-xl shadow-2xl animate-in fade-in duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

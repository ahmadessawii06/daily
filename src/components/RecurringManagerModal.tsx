import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Repeat, 
  Trash2, 
  Pause, 
  Play, 
  Clock, 
  Calendar, 
  Flame, 
  Check, 
  Edit2, 
  Sparkles,
  Layers
} from 'lucide-react';
import { Language, RecurringFrequency, RecurringItem, TaskCategory, TaskPriority } from '../types';
import { getFrequencyLabel, createRecurringItem, updateRecurringItem, deleteRecurringItem } from '../utils/recurring';
import { autoDetectCategory } from '../utils/categories';

interface RecurringManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringItems: RecurringItem[];
  onItemsChange: (items: RecurringItem[]) => void;
  lang: Language;
}

export const RecurringManagerModal: React.FC<RecurringManagerModalProps> = ({
  isOpen,
  onClose,
  recurringItems,
  onItemsChange,
  lang,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]); // Sun - Thu
  const [everyXDays, setEveryXDays] = useState<number>(3);
  const [targetDuration, setTargetDuration] = useState<number>(30);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [icon, setIcon] = useState('🔁');

  if (!isOpen) return null;

  const dayOptions = [
    { num: 0, ar: 'أحد', en: 'Sun' },
    { num: 1, ar: 'اثنين', en: 'Mon' },
    { num: 2, ar: 'ثلاثاء', en: 'Tue' },
    { num: 3, ar: 'أربعاء', en: 'Wed' },
    { num: 4, ar: 'خميس', en: 'Thu' },
    { num: 5, ar: 'جمعة', en: 'Fri' },
    { num: 6, ar: 'سبت', en: 'Sat' },
  ];

  const toggleDay = (num: number) => {
    if (selectedDays.includes(num)) {
      setSelectedDays(selectedDays.filter((d) => d !== num));
    } else {
      setSelectedDays([...selectedDays, num].sort());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingId) {
      const updated = updateRecurringItem(editingId, {
        title: title.trim(),
        frequency,
        selectedDays: frequency === 'selected_days' ? selectedDays : undefined,
        everyXDays: frequency === 'every_x_days' ? everyXDays : undefined,
        targetDuration,
        priority,
        icon,
        category: autoDetectCategory(title.trim()),
      });
      onItemsChange(updated);
      setEditingId(null);
    } else {
      const newItem = createRecurringItem({
        title: title.trim(),
        frequency,
        selectedDays: frequency === 'selected_days' ? selectedDays : undefined,
        everyXDays: frequency === 'every_x_days' ? everyXDays : undefined,
        targetDuration,
        priority,
        icon,
      });
      onItemsChange([newItem, ...recurringItems]);
    }

    // Reset
    setTitle('');
    setIsAddingNew(false);
  };

  const handleEditClick = (item: RecurringItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setFrequency(item.frequency);
    setSelectedDays(item.selectedDays || [0, 1, 2, 3, 4]);
    setEveryXDays(item.everyXDays || 3);
    setTargetDuration(item.targetDuration || 30);
    setPriority(item.priority || 'medium');
    setIcon(item.icon || '🔁');
    setIsAddingNew(true);
  };

  const handleTogglePause = (item: RecurringItem) => {
    const updated = updateRecurringItem(item.id, { isActive: !item.isActive });
    onItemsChange(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteRecurringItem(id);
    onItemsChange(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#11131a] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-['Alexandria']"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Repeat className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                {lang === 'ar' ? 'إدارة العادات والأشياء المتكررة' : 'Recurring Tasks & Habits'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {lang === 'ar' ? 'حدد الروتين مرة واحدة والتطبيق يتولى توليده وتتبعه' : 'Set your routine once and let the app track it automatically'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Add / Edit Form */}
          {isAddingNew ? (
            <form onSubmit={handleSave} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/[0.06]">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {editingId ? (lang === 'ar' ? 'تعديل العنصر' : 'Edit Routine') : (lang === 'ar' ? 'عنصر روتين جديد' : 'New Routine')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingId(null);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'ar' ? 'اسم الروتين أو المهمة' : 'Routine / Task Title'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: قراءة القرآن، دراسة Database، الاستحمام، قص الشعر...' : 'e.g. Read Quran, Study Database, Haircut...'}
                  className="w-full bg-white dark:bg-[#151722] border border-slate-200 dark:border-white/[0.1] rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Frequency Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'نوع التكرار' : 'Frequency'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                  {[
                    { id: 'daily', ar: 'يومياً', en: 'Daily' },
                    { id: 'selected_days', ar: 'أيام محددة', en: 'Selected Days' },
                    { id: 'every_x_days', ar: 'كل X أيام', en: 'Every X Days' },
                    { id: 'monthly', ar: 'شهرياً', en: 'Monthly' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrequency(f.id as RecurringFrequency)}
                      className={`py-2 px-2.5 rounded-xl font-medium text-[11px] transition-all cursor-pointer border ${
                        frequency === f.id
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 font-bold shadow-2xs'
                          : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-white/[0.06] hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'ar' ? f.ar : f.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Days (if selected_days) */}
              {frequency === 'selected_days' && (
                <div className="pt-1">
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                    {lang === 'ar' ? 'حدد الأيام' : 'Select Days'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {dayOptions.map((d) => (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => toggleDay(d.num)}
                        className={`py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          selectedDays.includes(d.num)
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-white/[0.05] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/[0.08]'
                        }`}
                      >
                        {lang === 'ar' ? d.ar : d.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Every X Days (if every_x_days) */}
              {frequency === 'every_x_days' && (
                <div className="pt-1">
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                    {lang === 'ar' ? 'يتكرر كل كم يوماً؟' : 'Repeats every how many days?'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={everyXDays}
                      onChange={(e) => setEveryXDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 bg-white dark:bg-[#151722] border border-slate-200 dark:border-white/[0.1] rounded-xl py-1.5 px-3 text-xs text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      {lang === 'ar' ? `(مثال: 3 للاستحمام، 10 للعناية، 30 لقص الشعر)` : `(e.g. 3 for deep shower, 30 for haircut)`}
                    </span>
                  </div>
                </div>
              )}

              {/* Target Duration & Priority */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                    {lang === 'ar' ? 'المدة المستهدفة (دقيقة)' : 'Duration (minutes)'}
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(parseInt(e.target.value) || 30)}
                    className="w-full bg-white dark:bg-[#151722] border border-slate-200 dark:border-white/[0.1] rounded-xl py-1.5 px-3 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                    {lang === 'ar' ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-white dark:bg-[#151722] border border-slate-200 dark:border-white/[0.1] rounded-xl py-1.5 px-3 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="high">{lang === 'ar' ? 'عالية 🔴' : 'High 🔴'}</option>
                    <option value="medium">{lang === 'ar' ? 'متوسطة 🟡' : 'Medium 🟡'}</option>
                    <option value="low">{lang === 'ar' ? 'منخفضة 🟢' : 'Low 🟢'}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-5 rounded-xl text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  {editingId ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (lang === 'ar' ? 'إضافة الروتين' : 'Add Routine')}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/[0.1] hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer bg-slate-50/50 dark:bg-white/[0.01]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{lang === 'ar' ? '+ إضافة روتين أو عادة جديدة' : '+ Add New Routine or Habit'}</span>
            </button>
          )}

          {/* List of Recurring Items */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 px-1">
              {lang === 'ar' ? `قائمتك الحالية (${recurringItems.length})` : `Your Active Routines (${recurringItems.length})`}
            </h4>

            {recurringItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                {lang === 'ar' ? 'لا يوجد عادات أو مهام متكررة مضافة' : 'No recurring routines yet'}
              </div>
            ) : (
              recurringItems.map((item) => {
                const freqLabel = getFrequencyLabel(item, lang);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      item.isActive
                        ? 'bg-white dark:bg-[#151722] border-slate-200/90 dark:border-white/[0.08] shadow-2xs'
                        : 'bg-slate-100/70 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/[0.04] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{item.icon || '🔁'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h5>
                          {!item.isActive && (
                            <span className="text-[10px] bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 py-0.5 px-1.5 rounded">
                              {lang === 'ar' ? 'موقوف' : 'Paused'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{freqLabel}</span>
                          <span>•</span>
                          <span>{item.targetDuration} {lang === 'ar' ? 'دقيقة' : 'min'}</span>
                          {item.currentStreak && item.currentStreak > 0 ? (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                <Flame className="w-3 h-3 fill-amber-500" />
                                {item.currentStreak}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePause(item)}
                        title={item.isActive ? (lang === 'ar' ? 'إيقاف مؤقت' : 'Pause') : (lang === 'ar' ? 'تفعيل' : 'Resume')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-500" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        title={lang === 'ar' ? 'تعديل' : 'Edit'}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        title={lang === 'ar' ? 'حذف' : 'Delete'}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold py-2 px-5 rounded-xl text-xs cursor-pointer transition-all"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

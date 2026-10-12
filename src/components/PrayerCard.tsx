import { Moon, MoonStar, Pencil, Sun, SunMedium, Sunrise, Sunset, Trash2 } from 'lucide-react';
import type { Language, Task, TaskStatus } from '../types';
import type { DailyPrayer } from '../utils/prayerTasks';
import { nextTaskStatus } from '../utils/taskStatus';
import { formatTime12h } from '../utils/date';
import { StatCircle } from './StatCircle';
import { TaskStatusIndicator } from './TaskStatusIndicator';

const prayerIcons = { fajr: Sunrise, dhuhr: Sun, asr: SunMedium, maghrib: Sunset, isha: Moon };

interface PrayerCardProps {
  slots: { prayer: DailyPrayer; task?: Task }[];
  lang: Language;
  onAddPrayer: (title: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function PrayerCard({ slots, lang, onAddPrayer, onStatusChange, onEdit, onDelete }: PrayerCardProps) {
  const ar = lang === 'ar';
  const done = slots.filter(slot => slot.task?.status === 'done').length;
  const notDone = slots.filter(slot => slot.task?.status === 'not-done').length;
  const pending = slots.length - done - notDone;
  const labels = ar ? { done: 'مكتملة', pending: 'متبقية', 'not-done': 'غير منجزة' }
    : { done: 'Completed', pending: 'Remaining', 'not-done': 'Not done' };
  return (
    <article data-prayer-card aria-label={ar ? 'الصلوات الخمس' : 'Five daily prayers'} className="col-span-full min-w-0 overflow-hidden rounded-3xl border border-emerald-300/70 bg-linear-to-br from-emerald-50 via-white to-amber-50/60 p-4 shadow-xs dark:border-emerald-400/25 dark:from-[#102521] dark:via-[#111b1c] dark:to-[#202219] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-3">
          <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-100/70 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200"><MoonStar className="h-6 w-6" strokeWidth={1.6} /></div>
          <div><h3 className="text-base font-bold">{ar ? 'الصلوات الخمس' : 'Five daily prayers'}</h3><p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-100/60">{ar ? `${done} من 5 مكتملة · لحظات ثابتة في يومك` : `${done} of 5 complete · A steady daily rhythm`}</p></div>
        </div>
        <div data-prayer-stats role="group" aria-label={ar ? 'إحصائيات الصلوات' : 'Prayer statistics'} className="grid w-full grid-cols-4 gap-3 sm:w-auto sm:min-w-64">
          <StatCircle compact label={labels.done} value={done} percentage={done * 20} color="emerald" isActive={false} subLabel={`${done * 20}%`} />
          <StatCircle compact label={labels.pending} value={pending} percentage={pending * 20} color="amber" isActive={false} subLabel={`${pending * 20}%`} />
          <StatCircle compact label={labels['not-done']} value={notDone} percentage={notDone * 20} color="rose" isActive={false} subLabel={`${notDone * 20}%`} />
          <StatCircle compact label={ar ? 'الإجمالي' : 'Total'} value={5} percentage={100} color="indigo" isActive={true} subLabel={ar ? 'صلوات' : 'prayers'} />
        </div>
      </div>
      {done === 5 && <blockquote role="status" lang="ar" dir="rtl" className="mt-5 rounded-2xl border border-emerald-300/60 bg-emerald-100/70 px-4 py-4 text-center text-base leading-loose text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100 sm:text-lg">
        ﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾
      </blockquote>}
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-emerald-200/60 pt-4 dark:border-emerald-100/10 lg:grid-cols-5">
        {slots.map(({ prayer, task }, index) => {
          const status = task?.status || 'pending';
          const name = ar ? `صلاة ${prayer.nameAr}` : `${prayer.nameEn} prayer`;
          const PrayerIcon = prayerIcons[prayer.id];
          const appearance = status === 'done' ? 'border-emerald-400/60 bg-emerald-100/70 dark:bg-emerald-400/10'
            : status === 'not-done' ? 'border-rose-400/60 bg-rose-50 dark:bg-rose-400/10'
            : 'border-emerald-200/70 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]';
          return <div key={prayer.id} data-prayer-slot={prayer.id} data-prayer-status={status} className={`group min-w-0 rounded-2xl border p-3 ${index === 4 ? 'col-span-2 lg:col-span-1' : ''} ${appearance}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0"><PrayerIcon aria-hidden="true" className="mb-2 h-5 w-5 text-amber-700 dark:text-amber-200" strokeWidth={1.6} /><p className="break-words text-sm font-bold">{name}</p><p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-400">{task?.time ? formatTime12h(task.time, lang).formatted : (ar ? 'بدون وقت' : 'Unscheduled')}</p></div>
              <button type="button" data-task-status={status} aria-label={ar ? `تغيير حالة ${name}: ${labels[status]}` : `Change status of ${name}: ${labels[status]}`} onClick={() => task ? onStatusChange(task.id, nextTaskStatus(status)) : onAddPrayer(`صلاة ${prayer.nameAr}`)} className="group/status flex h-11 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-emerald-400"><TaskStatusIndicator status={status} /></button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-1">
              <span className={`text-[10px] font-semibold ${status === 'done' ? 'text-emerald-700 dark:text-emerald-300' : status === 'not-done' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-500 dark:text-zinc-400'}`}>{labels[status]}</span>
              {task && <span className="inline-flex"><button type="button" aria-label={ar ? `تعديل ${task.title}` : `Edit ${task.title}`} onClick={() => onEdit(task)} className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/60 dark:text-zinc-400 dark:hover:bg-white/5"><Pencil className="h-3 w-3" /></button><button type="button" aria-label={ar ? `حذف ${task.title}` : `Delete ${task.title}`} onClick={() => onDelete(task.id)} className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-rose-500 dark:text-zinc-400"><Trash2 className="h-3 w-3" /></button></span>}
            </div>
          </div>;
        })}
      </div>
    </article>
  );
}

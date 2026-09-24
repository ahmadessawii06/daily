import React from 'react';
import { X, Sparkles, Check, Clock, GraduationCap, FileCheck, MoonStar } from 'lucide-react';
import { Language } from '../types';
import { SCHEDULE_TEMPLATES, ScheduleTemplate } from '../utils/templates';
import { getCategoryMeta } from '../utils/categories';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  lang: Language;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  lang,
}) => {
  if (!isOpen) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-blue-500" />;
      case 'FileCheck':
        return <FileCheck className="w-5 h-5 text-indigo-500" />;
      case 'MoonStar':
        return <MoonStar className="w-5 h-5 text-emerald-500" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#11131a] border border-slate-200 dark:border-white/[0.1] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-['Alexandria']">
              {lang === 'ar' ? 'اختيار قالب الجدول اليومي' : 'Choose Schedule Template'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {lang === 'ar' 
                ? 'اختر القالب الأنسب لطبيعة يومك وسيتم ترتيب كتل المهام الزمنية فوراً' 
                : 'Select a template suited for your day and time blocks will be arranged'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates List */}
        <div className="p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-100 dark:divide-white/[0.04]">
          {SCHEDULE_TEMPLATES.map((tpl) => {
            const catMeta = getCategoryMeta(tpl.categoryTag);

            return (
              <div
                key={tpl.id}
                className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                    {renderIcon(tpl.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-['Alexandria']">
                        {lang === 'ar' ? tpl.nameAr : tpl.nameEn}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${catMeta.badgeClass}`}>
                        {tpl.tasks.length} {lang === 'ar' ? 'كتلة زمنية' : 'blocks'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {lang === 'ar' ? tpl.descriptionAr : tpl.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTemplate(tpl.id);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs hover:shadow-emerald-500/25 active:scale-98 cursor-pointer font-['Alexandria'] flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{lang === 'ar' ? 'تطبيق القالب' : 'Apply Template'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

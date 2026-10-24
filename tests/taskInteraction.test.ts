import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AddTaskModal } from '../src/components/AddTaskModal';
import { EditTaskModal } from '../src/components/EditTaskModal';
import type { Task } from '../src/types';

const noop = () => {};
const task: Task = {
  id: 'task-1',
  title: 'مراجعة الدرس',
  time: '09:00',
  status: 'pending',
  createdAt: '2026-10-24T09:00:00.000Z',
};

test('task dialogs expose keyboard and touch friendly controls in Arabic and English', () => {
  for (const lang of ['ar', 'en'] as const) {
    const add = renderToStaticMarkup(React.createElement(AddTaskModal, {
      isOpen: true,
      onClose: noop,
      onAdd: noop,
      lang,
    }));
    const edit = renderToStaticMarkup(React.createElement(EditTaskModal, {
      task,
      isOpen: true,
      onClose: noop,
      onUpdate: noop,
      onDelete: noop,
      lang,
    }));

    for (const html of [add, edit]) {
      assert.ok(html.includes('role="dialog"'), 'Dialog has an accessible role');
      assert.ok(html.includes('aria-modal="true"'), 'Dialog is marked modal');
      assert.ok(html.includes(`dir="${lang === 'ar' ? 'rtl' : 'ltr'}"`), 'Dialog direction follows the selected language');
    }
    assert.ok(add.includes(lang === 'ar' ? 'إغلاق إضافة المهمة' : 'Close add task'), 'Add dialog has a named close control');
    assert.ok(add.includes('min-h-11'), 'Add dialog controls meet the 44px touch target');
    assert.ok(edit.includes(lang === 'ar' ? 'حفظ التعديل' : 'Save changes'), 'Edit dialog retains its explicit save action');
  }
});

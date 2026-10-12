import test from 'node:test';
import assert from 'node:assert/strict';
import { Bike, BookOpen, BookOpenText, BrushCleaning, Car, Clock, Code2, Dumbbell, GraduationCap, MoonStar, PhoneCall, Sparkles, Users, Utensils, Wallet } from 'lucide-react';
import { getTaskContextIcon } from '../src/utils/taskIconHelper';

test('task icons understand Arabic diacritics, spelling and attached articles', () => {
  assert.equal(getTaskContextIcon('قِراءَةُ القُرْآنِ').icon, BookOpenText);
  assert.equal(getTaskContextIcon('التمارين').icon, Dumbbell);
  assert.equal(getTaskContextIcon('وبالدراجة إلى الحديقة').icon, Bike);
  assert.equal(getTaskContextIcon('سداد الفاتورة').icon, Wallet);
  assert.equal(getTaskContextIcon('تنظيف البيت').icon, BrushCleaning);
});

test('task icons distinguish specific activities from general categories', () => {
  assert.equal(getTaskContextIcon('دراسة برمجة React').icon, Code2);
  assert.equal(getTaskContextIcon('Read a book').icon, BookOpen);
  assert.equal(getTaskContextIcon('study for exam').icon, GraduationCap);
  assert.equal(getTaskContextIcon('مكالمة عميل').icon, PhoneCall);
  assert.equal(getTaskContextIcon('عشاء مع العائلة').icon, Utensils);
  assert.equal(getTaskContextIcon('صلاة العشاء').icon, MoonStar);
});

test('English keywords match whole words rather than unrelated substrings', () => {
  assert.equal(getTaskContextIcon('Research chapter').icon, GraduationCap);
  assert.equal(getTaskContextIcon('Community meeting').icon, Users);
  assert.equal(getTaskContextIcon('Check runtime behavior').icon, Sparkles);
  assert.equal(getTaskContextIcon('Update postcard').icon, Sparkles);
});

test('icons derive from edited titles without stored metadata, with safe fallbacks', () => {
  assert.equal(getTaskContextIcon('Book club').icon, BookOpen);
  assert.equal(getTaskContextIcon('Drive to office').icon, Car);
  assert.equal(getTaskContextIcon('خطوة صغيرة').icon, Sparkles);
  assert.equal(getTaskContextIcon('   ').icon, Clock);
  assert.equal(getTaskContextIcon().icon, Clock);
});

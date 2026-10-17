import test from 'node:test';
import assert from 'node:assert/strict';
import type { DayRecord, Task } from '../src/types';
import { canMoveTask, getFocusTasks } from '../src/shared/taskPlanning';
import { mergeDay } from '../src/shared/merge';
import { createWorkspace } from '../src/shared/workspace';

class MemoryStorage {
  values = new Map<string, string>();
  failQueue = false;
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.failQueue && key.endsWith('sync_queue_v4')) throw new Error('Quota exceeded'); this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const memory = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true });
Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true });
const auth = await import('../src/utils/auth');
const storage = await import('../src/utils/storage');
const workspace = await import('../src/utils/workspace');
const queue = await import('../src/services/syncQueue');
const date = '2026-12-31', tomorrow = '2027-01-01', stamp = '2027-01-01T12:00:00.000Z';
const task = (id: string, extra: Partial<Task> = {}): Task => ({ id, title: `Task ${id}`, time: '09:30', endTime: '10:45', duration: 75, status: 'pending', notes: 'Keep these notes', categoryId: 'work', priority: 'high', deadline: '2027-01-03', createdAt: '2026-12-01T12:00:00.000Z', updatedAt: stamp, ...extra });
const record = (tasks: Task[], day = date, extra: Partial<DayRecord> = {}): DayRecord => ({ date: day, tasks, dayNote: 'Keep day note', updatedAt: stamp, ...extra });
const seed = (days: Record<string, DayRecord>) => { auth.saveStoredAuth({ id: 'planning-owner', userCode: 'OWNER' }, 'test-token'); workspace.storeWorkspace(createWorkspace('cards')); storage.saveAllDays(days); queue.saveQueue([]); };

test('day photo saves on its date and deletion survives stale sync and newer task edits', () => {
  seed({ [date]: record([task('photo-task')], date, { notes: 'My writing' }), [tomorrow]: record([], tomorrow) });
  const photo = 'data:image/jpeg;base64,/9j/2Q==';
  assert.equal(storage.saveDayPhoto(date, photo), true);
  const saved = storage.getDayRecord(date);
  assert.equal(saved.dayPhoto, photo);
  assert.equal(saved.notes, 'My writing');
  assert.equal(storage.getDayRecord(tomorrow).dayPhoto, undefined);
  assert.equal(queue.getQueue().find(item => item.date === date)?.data.dayPhoto, photo);
  assert.equal(storage.saveDayPhoto(date, ''), true);
  const deleted = storage.getDayRecord(date);
  assert.equal(mergeDay(deleted, saved).dayPhoto, '');
  assert.equal(mergeDay(deleted, { ...saved, dayPhoto: undefined, dayPhotoUpdatedAt: undefined, updatedAt: '2099-01-01T00:00:00.000Z' }).dayPhoto, '');
  memory.failQueue = true;
  try { assert.equal(storage.saveDayPhoto(date, photo), false); assert.equal(storage.getDayRecord(date).dayPhoto, ''); }
  finally { memory.failQueue = false; }
});

test('journal saves and clears on its own day while preserving tasks and queueing sync', () => {
  seed({ [date]: record([task('journal-task')]), [tomorrow]: record([], tomorrow, { notes: 'Tomorrow' }) });
  assert.equal(storage.saveDayJournal(date, 'أحداث يومي\nوشعوري اليوم'), true);
  assert.equal(storage.getDayRecord(date).notes, 'أحداث يومي\nوشعوري اليوم');
  assert.deepEqual(storage.getDayRecord(date).tasks, [task('journal-task')]);
  assert.equal(storage.getDayRecord(date).dayNote, 'Keep day note');
  assert.equal(storage.getDayRecord(tomorrow).notes, 'Tomorrow');
  assert.equal(queue.getQueue().find(item => item.date === date)?.data.notes, 'أحداث يومي\nوشعوري اليوم');
  assert.equal(storage.saveDayJournal(date, ''), true);
  assert.equal(storage.getDayRecord(date).notes, '');
});

test('journal reports a queue failure without committing an unsyncable edit', () => {
  seed({ [date]: record([], date, { notes: 'Original' }) });
  memory.failQueue = true;
  try {
    assert.equal(storage.saveDayJournal(date, 'New writing'), false);
    assert.equal(storage.getDayRecord(date).notes, 'Original');
  } finally { memory.failQueue = false; }
});

test('undo restores complete tasks to the original day and survives stale synchronization', () => {
  const original = task('undo', { status: 'not-done', isTopFocus: true });
  const before = record([original, task('other')]); seed({ [date]: before });
  assert.deepEqual(storage.deleteTaskFromDay(date, original.id), original);
  const deleted = storage.getDayRecord(date), deletion = deleted.deletedTaskIds![original.id];
  assert.equal(mergeDay(deleted, before).tasks.some(t => t.id === original.id), false);
  storage.getDayRecord(tomorrow);
  assert.equal(storage.restoreTaskToDay(date, original, deletion), true);
  const restored = storage.getDayRecord(date), value = restored.tasks.find(t => t.id === original.id)!;
  for (const key of Object.keys(original).filter(key => key !== 'updatedAt') as (keyof Task)[]) assert.deepEqual(value[key], original[key], key);
  assert.ok(Date.parse(value.updatedAt!) > Date.parse(deletion));
  assert.equal(mergeDay(restored, deleted).tasks.some(t => t.id === original.id), true);
  assert.equal(restored.dayNote, before.dayNote);
  assert.equal(storage.getDayRecord(tomorrow).tasks.length, 0);
  assert.equal(storage.restoreTaskToDay(date, original, deletion), false, 'Cannot overwrite a live restored task');
});

test('undo refuses a newer deletion or replacement and never creates a fourth focus task', () => {
  const pinned = task('pinned', { isTopFocus: true }); seed({ [date]: record([pinned]) });
  storage.deleteTaskFromDay(date, pinned.id);
  const deleted = storage.getDayRecord(date), expected = deleted.deletedTaskIds![pinned.id];
  const newer = new Date(Date.parse(expected) + 10).toISOString();
  storage.saveAllDays({ [date]: { ...deleted, deletedTaskIds: { [pinned.id]: newer }, updatedAt: newer } });
  assert.equal(storage.restoreTaskToDay(date, pinned, expected), false);
  storage.saveAllDays({ [date]: { ...deleted, tasks: [1,2,3].map(id => task(String(id), { isTopFocus:true })) } });
  assert.equal(storage.restoreTaskToDay(date, pinned, expected), true);
  assert.equal(getFocusTasks(storage.getDayRecord(date).tasks).length, 3);
  assert.equal(storage.getDayRecord(date).tasks.find(t => t.id === pinned.id)?.isTopFocus, false);
});

test('focus pins persist on the same task, stay limited to three, and ignore prayers and empty slots', () => {
  const tasks = [1,2,3,4].map(id => task(String(id)));
  tasks.push(task('prayer', { title:'صلاة الفجر' }), task('slot', { title:'' }));
  seed({ [date]: record(tasks) });
  for (const id of ['1','2','3']) assert.equal(storage.toggleTaskFocus(date,id), 'pinned');
  const before = storage.loadAllDays();
  assert.equal(storage.toggleTaskFocus(date,'4'), 'limit'); assert.deepEqual(storage.loadAllDays(),before);
  assert.equal(storage.toggleTaskFocus(date,'prayer'), 'missing'); assert.equal(storage.toggleTaskFocus(date,'slot'), 'missing');
  assert.equal(storage.toggleTaskFocus(date,'2'), 'unpinned'); assert.equal(storage.toggleTaskFocus(date,'4'), 'pinned');
  workspace.setPlannerView('timeline'); assert.deepEqual(getFocusTasks(storage.getDayRecord(date).tasks).map(t=>t.id),['1','3','4']);
  const overflow = [1,2,3,4].map(id=>task(String(id),{isTopFocus:true}));
  assert.deepEqual(getFocusTasks(overflow).map(t=>t.id),getFocusTasks([...overflow].reverse()).map(t=>t.id));
  assert.equal(getFocusTasks(overflow).length,3);
});

test('moving selected unfinished tasks saves both dates, preserves details, clears day-specific pins and merges safely', () => {
  const moving = [task('one',{isTopFocus:true}),task('two',{status:'not-done',time:''})];
  const staying = [task('done',{status:'done'}),task('prayer',{title:'صلاة الظهر'}),task('slot',{title:''})];
  const before = record([...moving,...staying]);
  const target = record([task('target')],tomorrow,{dayNote:'Tomorrow note',notes:'Tomorrow notes',deletedTaskIds:{one:'2028-01-01T00:00:00.000Z'}});
  seed({[date]:before,[tomorrow]:target});
  const result = storage.moveTasksToNextDay(date,before.tasks.map(t=>t.id));
  assert.equal(result.date,tomorrow); assert.deepEqual(result.tasks.map(t=>t.id),['one','two']);
  const days=storage.loadAllDays();
  assert.deepEqual(days[date].tasks,staying); assert.equal(days[date].dayNote,before.dayNote);
  assert.equal(days[tomorrow].dayNote,target.dayNote); assert.equal(days[tomorrow].notes,target.notes);
  assert.equal(days[tomorrow].tasks.length,3);
  for(const original of moving){const moved=days[tomorrow].tasks.find(t=>t.id===original.id)!;
    for(const key of ['id','title','time','endTime','duration','notes','categoryId','priority','deadline','createdAt'] as const)assert.equal(moved[key],original[key],key);
    assert.equal(moved.status,'pending');assert.equal(moved.isTopFocus,false);
    assert.ok(Date.parse(moved.updatedAt!)>Date.parse(target.deletedTaskIds!.one));
    assert.equal(mergeDay(days[date],before).tasks.some(t=>t.id===original.id),false);
    assert.equal(mergeDay(target,days[tomorrow]).tasks.some(t=>t.id===original.id),true);
  }
  assert.deepEqual(new Set(queue.getQueue().map(item=>item.date)),new Set([date,tomorrow]));
  assert.equal(storage.moveTasksToNextDay(date,['one','two']).tasks.length,0,'Repeat click is idempotent');
  assert.equal(canMoveTask(staying[0]),false); assert.equal(canMoveTask(staying[1]),false); assert.equal(canMoveTask(staying[2]),false);
});

test('timeline moves preserve hourly placeholders; collisions and queue failures leave both days intact', () => {
  seed({[date]:record([task('move')])}); workspace.setPlannerView('timeline');
  storage.moveTasksToNextDay(date,['move']); assert.equal(storage.getDayRecord(tomorrow).tasks.length,25);
  seed({[date]:record([task('same')]),[tomorrow]:record([task('same',{title:'Independent target'})],tomorrow)});
  let before=storage.loadAllDays();assert.throws(()=>storage.moveTasksToNextDay(date,['same']),/TASK_MOVE_CONFLICT/);assert.deepEqual(storage.loadAllDays(),before);
  seed({[date]:record([task('failure')])});before=storage.loadAllDays();
  memory.failQueue=true;
  try{
    assert.throws(()=>storage.moveTasksToNextDay(date,['failure']),/LOCAL_SAVE_FAILED/);assert.deepEqual(storage.loadAllDays(),before);
    assert.throws(()=>storage.toggleTaskFocus(date,'failure'),/LOCAL_SAVE_FAILED/);assert.deepEqual(storage.loadAllDays(),before);
    assert.equal(storage.deleteTaskFromDay(date,'failure'),null);assert.deepEqual(storage.loadAllDays(),before);
  }finally{memory.failQueue=false;}
});

test('planning changes remain isolated between accounts and queue entries cover every changed date', () => {
  seed({[date]:record([task('mine')])}); storage.toggleTaskFocus(date,'mine');storage.moveTasksToNextDay(date,['mine']);
  const owner=storage.loadAllDays();const pending=queue.getQueue();
  auth.clearStoredAuth();auth.saveStoredAuth({id:'other-user',userCode:'OTHER'},'other-token');
  assert.deepEqual(storage.loadAllDays(),{});assert.deepEqual(queue.getQueue(),[]);assert.equal(storage.toggleTaskFocus(date,'mine'),'missing');
  auth.clearStoredAuth();auth.saveStoredAuth({id:'planning-owner',userCode:'OWNER'},'test-token');
  assert.deepEqual(storage.loadAllDays(),owner);assert.deepEqual(queue.getQueue(),pending);
});

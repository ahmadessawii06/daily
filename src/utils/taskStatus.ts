import type { TaskStatus } from '../types';

// Keep the card and timeline controls on the same three-state cycle.
export function nextTaskStatus(status: TaskStatus): TaskStatus {
  const next: Record<TaskStatus, TaskStatus> = {
    pending: 'done',
    done: 'not-done',
    'not-done': 'pending',
  };
  return next[status];
}

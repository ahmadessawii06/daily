export type AppPage = 'planner' | 'settings' | 'statistics' | 'archive' | 'admin';
const hashes: Record<AppPage, string> = {
  planner: '', settings: '#settings', statistics: '#settings/statistics', archive: '#settings/archive', admin: '#admin',
};
export function pageHash(page: AppPage): string { return hashes[page]; }
export function pageFromHash(hash: string): AppPage {
  return (Object.keys(hashes) as AppPage[]).find(page => hashes[page] === hash) || 'planner';
}

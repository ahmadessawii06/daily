export const colorThemes = [
  { id: 'default', ar: 'ميزان الأصلي', en: 'Original Mizan', descriptionAr: 'أخضر منعش ومساحة صافية', descriptionEn: 'Fresh green, a clear space', colors: ['#10e588', '#101219', '#f8fafc'] },
  { id: 'github', ar: 'كود جيتهب', en: 'GitHub Code', descriptionAr: 'فحمي نظيف ولمسات أزرق', descriptionEn: 'Clean charcoal and crisp blue', colors: ['#58a6ff', '#0d1117', '#f6f8fa'] },
  { id: 'hacker', ar: 'ماتريكس', en: 'Matrix', descriptionAr: 'أسود عميق وأخضر طرفية', descriptionEn: 'Deep black and terminal green', colors: ['#4ade80', '#080e0a', '#eefbf1'] },
  { id: 'red-dark', ar: 'قرمزي منتصف الليل', en: 'Midnight Crimson', descriptionAr: 'فحمي داكن وأحمر جريء', descriptionEn: 'Dark charcoal with bold crimson', colors: ['#fb7185', '#180d12', '#fff1f3'] },
  { id: 'ocean', ar: 'موج أزرق', en: 'Ocean Tide', descriptionAr: 'أزرق بحري وفيروزي منعش', descriptionEn: 'Navy depths and fresh turquoise', colors: ['#22d3ee', '#0b1b26', '#eefbff'] },
  { id: 'sunset', ar: 'وهج الغروب', en: 'Sunset Glow', descriptionAr: 'خوخي دافئ ولمسة نحاسية', descriptionEn: 'Warm peach and copper accents', colors: ['#fbab7e', '#261812', '#fff4eb'] },
  { id: 'olive', ar: 'زيتون فلسطين', en: 'Palestine Olive', descriptionAr: 'زيتون الأرض ودفء الحجر', descriptionEn: 'Olive groves and warm stone', colors: ['#879747', '#272b1e', '#f3efdf'] },
  { id: 'night', ar: 'ليل بنفسجي', en: 'Lavender Night', descriptionAr: 'أزرق عميق ولمسة لافندر', descriptionEn: 'Deep blue and soft lavender', colors: ['#a594f9', '#141a30', '#edf0fc'] },
  { id: 'paper', ar: 'حبر وورق', en: 'Ink & Paper', descriptionAr: 'ورق كريمي وحبر دافئ', descriptionEn: 'Cream paper and warm ink', colors: ['#bb8454', '#2b231e', '#faf2e3'] },
] as const;
export type ColorTheme = typeof colorThemes[number]['id'];
export function readColorTheme(): ColorTheme {
  try {
    const stored = localStorage.getItem('mizan_color_theme');
    return colorThemes.find(theme => theme.id === stored)?.id || 'default';
  } catch { return 'default'; }
}
export function applyColorTheme(theme: ColorTheme) {
  document.documentElement.dataset.colorTheme = theme;
}
export function saveColorTheme(theme: ColorTheme) {
  try { localStorage.setItem('mizan_color_theme', theme); } catch {}
  applyColorTheme(theme);
}

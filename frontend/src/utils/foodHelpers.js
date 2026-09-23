export const CATEGORY_LABELS = {
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  ROYAL: 'Royal',
  CUSTOM: 'Custom quote',
};

export const CATEGORY_STYLES = {
  STANDARD: { bg: '#e0f2fe', color: '#075985' },
  PREMIUM: { bg: '#fef3c7', color: '#92400e' },
  ROYAL: { bg: '#f3e8ff', color: '#6b21a8' },
  CUSTOM: { bg: '#f1f5f9', color: '#334155' },
};

export const emptyFoodMenuForm = {
  name: '',
  category: 'STANDARD',
  description: '',
  menu_lines: '',
  price_per_menu: '',
  is_active: true,
  display_order: 0,
};

export const linesToItems = (text) =>
  String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const itemsToLines = (items) =>
  Array.isArray(items) ? items.join('\n') : '';

export const parseFoodMenuToForm = (menu) => ({
  name: menu.name || '',
  category: menu.category || 'STANDARD',
  description: menu.description || '',
  menu_lines: itemsToLines(menu.menu_items),
  price_per_menu: menu.price_per_menu ?? '',
  is_active: menu.is_active !== false,
  display_order: menu.display_order ?? 0,
});

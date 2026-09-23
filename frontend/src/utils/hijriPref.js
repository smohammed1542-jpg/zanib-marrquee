export const HIJRI_PREF_EVENT = 'hallora-hijri-date';
const STORAGE_KEY = 'show_hijri_date';

export function readShowHijriDate() {
  return localStorage.getItem(STORAGE_KEY) !== '0';
}

export function publishShowHijriDate(value) {
  const on = Boolean(value);
  localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  window.dispatchEvent(new CustomEvent(HIJRI_PREF_EVENT, { detail: on }));
}

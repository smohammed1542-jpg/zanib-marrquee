import { useEffect, useState } from 'react';
import { getUserSettings } from '../api/core';
import { HIJRI_PREF_EVENT, readShowHijriDate } from '../utils/hijriPref';

export function useShowHijriDate() {
  const [show, setShow] = useState(readShowHijriDate);

  useEffect(() => {
    let cancelled = false;
    getUserSettings()
      .then((prefs) => {
        if (cancelled || typeof prefs?.show_hijri_date !== 'boolean') return;
        localStorage.setItem('show_hijri_date', prefs.show_hijri_date ? '1' : '0');
        setShow(prefs.show_hijri_date);
      })
      .catch(() => {});

    const onChange = (event) => setShow(Boolean(event.detail));
    window.addEventListener(HIJRI_PREF_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(HIJRI_PREF_EVENT, onChange);
    };
  }, []);

  return show;
}

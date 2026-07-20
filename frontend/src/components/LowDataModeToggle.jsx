import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';

export default function LowDataModeToggle() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem('lowDataMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('lowDataMode', String(enabled));
    if (enabled) {
      document.body.classList.add('low-data-mode');
    } else {
      document.body.classList.remove('low-data-mode');
    }
  }, [enabled]);

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={() => setEnabled(!enabled)}
        style={{ width: 18, height: 18, accentColor: 'var(--crimson)' }}
      />
      <WifiOff size={16} />
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('settings.lowDataMode')}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('settings.lowDataModeDesc')}</div>
      </div>
    </label>
  );
}

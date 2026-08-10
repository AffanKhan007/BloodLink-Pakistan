import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Phone, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import LowDataModeToggle from '../../components/LowDataModeToggle';

const MOCK_LOG = [
  { id: 1, channel: 'sms', to: '+92-300-1234567', status: 'delivered', preview: 'Your blood request has been matched with a donor...', sent_at: '2025-12-15T10:30:00' },
  { id: 2, channel: 'whatsapp', to: '+92-321-7654321', status: 'delivered', preview: 'Donor Ali accepted your match for AB+ blood...', sent_at: '2025-12-15T11:00:00' },
  { id: 3, channel: 'sms', to: '+92-333-1111222', status: 'failed', preview: 'Reminder: Your donation drive starts tomorrow...', sent_at: '2025-12-15T14:00:00' },
  { id: 4, channel: 'whatsapp', to: '+92-345-9998888', status: 'pending', preview: 'New urgent CRITICAL request in Lahore...', sent_at: '2025-12-15T15:30:00' },
  { id: 5, channel: 'in_app', to: 'user:5', status: 'delivered', preview: 'Your blood request status changed to fulfilled', sent_at: '2025-12-15T16:00:00' },
];

const statusIcon = {
  delivered: <CheckCircle size={14} style={{ color: '#16a34a' }} />,
  failed: <XCircle size={14} style={{ color: '#dc2626' }} />,
  pending: <Clock size={14} style={{ color: '#d97706' }} />,
};

export default function NotificationSettingsPage() {
  const { t } = useTranslation();
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  return (
    <section className="page-container">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{t('notifications.whatsappSettings')}</h1>
          <p className="page-subtitle">Configure notification delivery preferences (mocked in this MVP)</p>
        </div>
      </div>

      <div className="request-card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Notification Channels</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={smsEnabled} onChange={() => setSmsEnabled(!smsEnabled)} style={{ width: 18, height: 18, accentColor: 'var(--crimson)' }} />
            <Phone size={16} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('settings.smsNotifications')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Receive SMS alerts for urgent matches (mocked — no real provider)</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={whatsappEnabled} onChange={() => setWhatsappEnabled(!whatsappEnabled)} style={{ width: 18, height: 18, accentColor: 'var(--crimson)' }} />
            <MessageSquare size={16} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('settings.whatsappNotifications')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Receive WhatsApp alerts for urgent matches (mocked — no real provider)</div>
            </div>
          </label>
        </div>
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-input)', fontSize: '0.75rem', color: 'var(--muted)' }}>
          <Activity size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
          These settings are persisted to localStorage only. No real SMS/WhatsApp provider is connected in this MVP.
        </div>
      </div>

      <div className="request-card">
        <h3 style={{ marginBottom: 12 }}>{t('notifications.deliveryLog')}</h3>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 12 }}>
          Mocked delivery history — not connected to a real notification service.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--muted)' }}>Channel</th>
                <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--muted)' }}>To</th>
                <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--muted)' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--muted)' }}>Preview</th>
                <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--muted)' }}>Sent</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LOG.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 4px', textTransform: 'capitalize' }}>{entry.channel}</td>
                  <td style={{ padding: '8px 4px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{entry.to}</td>
                  <td style={{ padding: '8px 4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {statusIcon[entry.status]}
                      <span style={{ textTransform: 'capitalize' }}>{entry.status}</span>
                    </span>
                  </td>
                  <td style={{ padding: '8px 4px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.preview}</td>
                  <td style={{ padding: '8px 4px', fontSize: '0.7rem', color: 'var(--muted)' }}>{new Date(entry.sent_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="request-card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Display Settings</h3>
        <LowDataModeToggle />
        <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--muted)' }}>
          Mocked toggle — no real conditional rendering is implemented yet.
        </div>
      </div>
    </section>
  );
}

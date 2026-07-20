import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Building2, Droplets, GitMerge, MapPin, TrendingUp } from 'lucide-react';
import { apiRequest } from '../../api/client';

export default function TransparencyPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest('/api/v1/blood-banks/transparency-stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { icon: Users, label: t('transparency.totalDonors'), value: stats.total_donors },
    { icon: TrendingUp, label: t('transparency.requestsFulfilled'), value: stats.total_requests_fulfilled },
    { icon: Building2, label: t('transparency.bloodBanks'), value: stats.total_blood_banks },
    { icon: Shield, label: t('transparency.govtVerifiedBanks'), value: stats.govt_verified_blood_banks },
    { icon: Building2, label: t('transparency.institutions'), value: stats.approved_institutions },
    { icon: Droplets, label: t('transparency.bloodUnitsAvailable'), value: stats.total_blood_units_available },
    { icon: GitMerge, label: t('transparency.matchesMade'), value: stats.total_matches_made },
    { icon: MapPin, label: t('transparency.citiesCovered'), value: stats.cities_covered },
  ] : [];

  return (
    <section className="page-container">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{t('transparency.title')}</h1>
          <p className="page-subtitle">{t('transparency.subtitle')}</p>
        </div>
      </div>

      {loading && <p className="empty-state-text">{t('common.loading')}</p>}
      {!loading && !stats && <p className="empty-state-text">{t('common.noData')}</p>}

      {stats && (
        <>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            {statCards.map((s) => (
              <div key={s.label} className="stat-card">
                <s.icon size={20} style={{ color: 'var(--crimson)' }} />
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="request-card" style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 12 }}>Fulfillment & Reliability</h3>
            <div className="request-card-meta-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div>
                <div className="request-card-meta-label">{t('transparency.fulfillmentRate')}</div>
                <div className="request-card-meta-value" style={{ fontSize: '1.25rem', color: 'var(--crimson)' }}>
                  {stats.requester_fulfillment_rate}%
                </div>
              </div>
              <div>
                <div className="request-card-meta-label">{t('transparency.reliabilityScore')}</div>
                <div className="request-card-meta-value" style={{ fontSize: '1.25rem', color: 'var(--crimson)' }}>
                  {stats.avg_reliability_score}%
                </div>
              </div>
            </div>
          </div>

          <div className="request-card" style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--muted)' }}>
            <p>All statistics are calculated from live database records. No numbers are simulated or hardcoded.</p>
          </div>
        </>
      )}
    </section>
  );
}

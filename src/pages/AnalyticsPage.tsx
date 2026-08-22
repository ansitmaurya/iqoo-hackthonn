import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  ShieldAlert, 
  PieChart as PieIcon, 
  MapPin 
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import { SyntheticDataBanner } from '../components/SyntheticDataBanner';

const COLORS = ['#00f2fe', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#f97316'];

export const AnalyticsPage: React.FC = () => {
  const { transactions } = useSentinelStore();

  // 1. Risk Score Distribution Data
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: '0–20 (Low)', count: 0, color: '#10b981' },
      { range: '21–40 (Low)', count: 0, color: '#34d399' },
      { range: '41–60 (Med)', count: 0, color: '#f59e0b' },
      { range: '61–80 (High)', count: 0, color: '#f97316' },
      { range: '81–100 (Crit)', count: 0, color: '#ef4444' }
    ];

    transactions.forEach(t => {
      if (t.riskScore <= 20) buckets[0].count++;
      else if (t.riskScore <= 40) buckets[1].count++;
      else if (t.riskScore <= 60) buckets[2].count++;
      else if (t.riskScore <= 80) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [transactions]);

  // 2. Top Triggered Rules Data
  const topRulesData = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      t.triggeredRules.forEach(r => {
        counts[r.ruleName] = (counts[r.ruleName] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.length > 24 ? name.substring(0, 22) + '...' : name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [transactions]);

  // 3. Category Fraud Exposure
  const categoryExposure = useMemo(() => {
    const cats: Record<string, { totalAmount: number; flaggedAmount: number }> = {};
    transactions.forEach(t => {
      const cat = t.category.replace(/_/g, ' ');
      if (!cats[cat]) cats[cat] = { totalAmount: 0, flaggedAmount: 0 };
      cats[cat].totalAmount += t.amount;
      if (t.flagged || t.riskScore >= 60) {
        cats[cat].flaggedAmount += t.amount;
      }
    });

    return Object.entries(cats).map(([name, data]) => ({
      name,
      value: Math.round(data.flaggedAmount),
      total: Math.round(data.totalAmount)
    })).filter(c => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions]);

  // 4. Geolocation Threat Distribution
  const geoThreats = useMemo(() => {
    const cities: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.flagged || t.riskScore >= 60) {
        cities[t.location.city] = (cities[t.location.city] || 0) + 1;
      }
    });

    return Object.entries(cities)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [transactions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <SyntheticDataBanner />

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Risk Intelligence & Fraud Analytics
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Aggregated analytics, threat typology distributions, and category vulnerability heatmaps.
        </p>
      </div>

      {/* 2x2 Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Chart 1: Risk Score Distribution */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '340px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={16} color="var(--accent-cyan)" />
            <span>Risk Score Distribution (0–100)</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Population volume segmented by deterministic engine risk thresholds
          </div>

          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={scoreDistribution[index].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Triggered Rules */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '340px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} color="#ef4444" />
            <span>Top Triggered Threat Detection Rules</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Rule trigger frequency across active synthetic transaction stream
          </div>

          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRulesData} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Category At-Risk Exposure */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '340px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PieIcon size={16} color="var(--accent-blue)" />
            <span>Flagged Volume by Merchant Category ($ USD)</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Suspicious exposure concentrations in Crypto, Remittance, and Luxury
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', width: '100%' }}>
            <div style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryExposure}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryExposure.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'At Risk']}
                    contentStyle={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '170px' }}>
              {categoryExposure.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                    <span style={{ color: 'var(--text-secondary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                  </div>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${(cat.value / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Geolocation Threat Hops */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '340px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} color="#f59e0b" />
            <span>Impossible Travel & Threat Origins by City</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Geographic anomalies flagged by Haversine speed & IP hop rules
          </div>

          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoThreats}>
                <XAxis dataKey="city" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

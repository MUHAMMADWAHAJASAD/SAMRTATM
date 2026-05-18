import { useState, useEffect } from 'react';
import { dashboardService, atmService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, CheckCircle, Database, Zap } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [plan, setPlan] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchData = async () => {
      try {
        const [statsRes, planRes, alertsRes] = await Promise.all([
          dashboardService.getStats(),
          atmService.getRefillPlan(),
          dashboardService.getAlerts()
        ]);
        setStats(statsRes.data);
        setPlan(planRes.data);
        setAlerts(alertsRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      await dashboardService.simulateTraffic();
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div></div>;
  }

  const statCards = [
    { title: 'Total ATMs', value: stats?.total_atms, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active', value: stats?.active_atms, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Low Cash', value: stats?.low_cash_atms, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Dispensed Today', value: `Rs. ${stats?.total_cash_dispensed_today?.toLocaleString() || 0}`, icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
  ];

  const chartData = plan.slice(0, 5).map(p => ({
    name: `ATM ${p.atm_id}`,
    Current: p.current_cash,
    Predicted: p.predicted_demand
  }));

  return (
    <div className="space-y-6">
      {/* Alerts Banner */}
      {alerts.length > 0 && alerts.some(a => !a.is_resolved) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Critical Alerts Detected</h3>
            <p className="text-red-700 text-sm mt-1">{alerts.filter(a => !a.is_resolved)[0]?.message}</p>
          </div>
        </div>
      )}

      {/* Simulate Traffic Banner */}
      <div className="glass-card bg-gradient-to-r from-brand-600 to-blue-700 p-6 flex items-center justify-between shadow-lg shadow-brand-200">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-300" />
            Live Traffic Simulation
          </h2>
          <p className="text-brand-100 mt-1">Organically deplete ATM cash levels based on real-time ML demand to test the system.</p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="px-6 py-3 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-sm disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {simulating ? (
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Zap className="w-5 h-5" />
          )}
          {simulating ? 'Simulating...' : 'Simulate Traffic'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-2xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Current Cash vs Predicted Demand (Next 24h)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Rs. ${value/1000}k`} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="Current" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Predicted" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Refill Plan */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Smart Refill Priority</h3>
          <div className="space-y-4">
            {plan.filter(p => p.recommended_refill > 0).slice(0, 4).map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">ATM #{p.atm_id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.refill_urgency === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.refill_urgency}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Loc: {p.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">+Rs. {p.recommended_refill.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {plan.filter(p => p.recommended_refill > 0).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                All ATMs are currently well-funded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

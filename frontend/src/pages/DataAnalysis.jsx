import { useState, useEffect } from 'react';
import { analysisService } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Brain, AlertTriangle, Target, TrendingUp, Clock, Layers, Zap, Shield } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const CLUSTER_COLORS = { 'High Demand': '#ef4444', 'Medium Demand': '#f59e0b', 'Low Demand': '#10b981' };

export default function DataAnalysis() {
  const [patterns, setPatterns] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('patterns');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [patternsRes, clustersRes, anomaliesRes] = await Promise.all([
        analysisService.getPatterns(),
        analysisService.getClusters(),
        analysisService.getAnomalies()
      ]);
      setPatterns(patternsRes.data);
      setClusters(clustersRes.data);
      setAnomalies(anomaliesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'patterns', label: 'Pattern Mining', icon: TrendingUp },
    { id: 'clusters', label: 'ATM Clustering', icon: Layers },
    { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
    { id: 'classification', label: 'Classification', icon: Target },
  ];

  // Compute cluster distribution for pie chart
  const clusterDist = clusters.reduce((acc, c) => {
    acc[c.cluster] = (acc[c.cluster] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(clusterDist).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-to-r from-brand-50 to-purple-50 border-brand-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-100 rounded-2xl">
            <Brain className="w-7 h-7 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Data Mining & ML Analytics</h2>
            <p className="text-sm text-gray-500 mt-0.5">Pattern mining, clustering, classification, and anomaly detection across your ATM network</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB: PATTERN MINING */}
      {activeTab === 'patterns' && patterns && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Pattern */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                Weekly Withdrawal Patterns
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patterns.daily}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `Rs. ${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }} 
                      formatter={(v) => [`Rs. ${v.toLocaleString()}`, 'Avg Withdrawal']}
                    />
                    <Bar dataKey="avg_withdrawals" fill="url(#blueGradient)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly Pattern */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Hourly Demand Heatmap
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={patterns.hourly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={h => `${h}:00`} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
                      formatter={(v) => [`Rs. ${v.toLocaleString()}`, 'Avg Withdrawal']}
                      labelFormatter={(h) => `${h}:00`}
                    />
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="avg_withdrawals" stroke="#f59e0b" strokeWidth={2} fill="url(#areaGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly / Seasonal */}
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Seasonal Withdrawal Trends (Monthly)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patterns.monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `Rs. ${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
                    formatter={(v) => [`Rs. ${v.toLocaleString()}`, 'Total']}
                    labelFormatter={(m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]}
                  />
                  <Line type="monotone" dataKey="total_withdrawals" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CLUSTERING */}
      {activeTab === 'clusters' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Cluster Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} (${(percent*100).toFixed(0)}%)`}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={CLUSTER_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cluster Table */}
            <div className="lg:col-span-2 glass-card overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800">KMeans Cluster Assignments</h3>
                <p className="text-xs text-gray-500 mt-1">ATMs grouped by withdrawal and deposit behavior using KMeans (k=3)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-left">ATM</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Location</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Cluster</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Avg Withdrawals</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Avg Deposits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clusters.map(c => (
                      <tr key={c.atm_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">#{c.atm_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.location}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{
                            background: `${CLUSTER_COLORS[c.cluster] || '#6b7280'}15`,
                            color: CLUSTER_COLORS[c.cluster] || '#6b7280'
                          }}>{c.cluster}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">Rs. {c.avg_withdrawals.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">Rs. {c.avg_deposits.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ANOMALY DETECTION */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5 flex items-center gap-4 bg-red-50/30 border-red-100">
              <div className="p-3 rounded-2xl bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Anomalies</p>
                <p className="text-2xl font-bold text-red-600">{anomalies.length}</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-100">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">High Severity</p>
                <p className="text-2xl font-bold text-amber-600">{anomalies.filter(a => a.severity === 'High').length}</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-purple-100">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Detection Model</p>
                <p className="text-lg font-bold text-purple-600">Isolation Forest</p>
              </div>
            </div>
          </div>

          {/* Anomaly List */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Detected Anomalies (Last 72h)
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {anomalies.map((a, i) => (
                <div key={i} className="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    a.severity === 'High' ? 'bg-red-100' : a.severity === 'Medium' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      a.severity === 'High' ? 'text-red-600' : a.severity === 'Medium' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">ATM #{a.atm_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.severity === 'High' ? 'bg-red-100 text-red-700' : 
                        a.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>{a.severity}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{a.type}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Amount: Rs. {a.amount.toLocaleString()} • {new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CLASSIFICATION */}
      {activeTab === 'classification' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-600" />
              ATM Demand Classification
            </h3>
            <p className="text-sm text-gray-500 mb-6">Each ATM is classified into High, Medium, or Low demand based on historical withdrawals and deposits using supervised learning</p>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['High Demand', 'Medium Demand', 'Low Demand'].map((level) => {
                const atmsInLevel = clusters.filter(c => c.cluster === level);
                return (
                  <div key={level} className="rounded-2xl p-5 border" style={{
                    borderColor: `${CLUSTER_COLORS[level]}30`,
                    background: `${CLUSTER_COLORS[level]}08`
                  }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full" style={{ background: CLUSTER_COLORS[level] }}></div>
                      <h4 className="font-semibold text-gray-900">{level}</h4>
                      <span className="ml-auto text-sm font-bold" style={{ color: CLUSTER_COLORS[level] }}>{atmsInLevel.length} ATMs</span>
                    </div>
                    <div className="space-y-2">
                      {atmsInLevel.map(atm => (
                        <div key={atm.atm_id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                          <span className="text-sm font-medium text-gray-800">ATM #{atm.atm_id}</span>
                          <span className="text-xs text-gray-500">Rs. {atm.avg_withdrawals.toLocaleString()}/day</span>
                        </div>
                      ))}
                      {atmsInLevel.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">No ATMs in this category</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

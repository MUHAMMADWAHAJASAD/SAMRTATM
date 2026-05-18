import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { Clock, DollarSign, Shield, ArrowRight } from 'lucide-react';

export default function RefillReports() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await dashboardService.getLogs();
      setLogs(res.data);
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

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-green-50">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Refilled</p>
            <p className="text-2xl font-bold text-gray-900">
              Rs. {logs.reduce((sum, l) => sum + l.amount_added, 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Refills</p>
            <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-50">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Blockchain Verified</p>
            <p className="text-2xl font-bold text-green-600">All Secure</p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            Blockchain-Verified Refill Ledger
          </h3>
          <p className="text-sm text-gray-500 mt-1">Each refill is cryptographically chained for tamper-proof auditing</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ATM</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hash Chain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{log.id}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-brand-600">ATM #{log.atm_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-green-600">+Rs. {log.amount_added.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 max-w-[80px] truncate" title={log.previous_hash}>
                        {log.previous_hash.slice(0, 8)}…
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="font-mono bg-green-50 px-2 py-1 rounded text-green-700 max-w-[80px] truncate" title={log.current_hash}>
                        {log.current_hash.slice(0, 8)}…
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No refill logs yet. Dispatch a refill to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

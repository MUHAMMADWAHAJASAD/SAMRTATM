import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { atmService } from '../services/api';
import { Bot, MapPin, Banknote, Activity } from 'lucide-react';

export default function AtmMonitoring() {
  const navigate = useNavigate();
  const [atms, setAtms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAtm, setSelectedAtm] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);

  useEffect(() => {
    fetchAtms();
  }, []);

  const fetchAtms = async () => {
    try {
      const response = await atmService.getAtms();
      setAtms(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (id) => {
    setPredLoading(true);
    setSelectedAtm(id);
    try {
      const response = await atmService.getPrediction(id);
      setPrediction(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setPredLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* ATM List */}
      <div className="xl:col-span-2 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Network Infrastructure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {atms.map((atm) => (
            <div 
              key={atm.id} 
              className={`glass-card p-5 cursor-pointer transition-all border-2 ${selectedAtm === atm.id ? 'border-brand-500 shadow-md' : 'border-transparent'}`}
              onClick={() => handlePredict(atm.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${atm.status === 'Active' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Activity className={`w-5 h-5 ${atm.status === 'Active' ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">ATM #{atm.id}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {atm.location}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${atm.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {atm.status}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Reserve</p>
                <p className="text-2xl font-bold text-gray-900 flex items-center">
                  <Banknote className="w-5 h-5 text-gray-400" />
                  Rs. {atm.current_cash.toLocaleString()}
                </p>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${atm.current_cash > 20000 ? 'bg-green-500' : 'bg-red-500'}`} 
                  style={{ width: `${Math.min((atm.current_cash / 5000000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prediction Side Panel */}
      <div className="xl:col-span-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 xl:mb-2 xl:mt-0 mt-8">AI Analysis Engine</h3>
        
        {!selectedAtm ? (
          <div className="glass-card h-64 flex flex-col items-center justify-center p-6 text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
            <Bot className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">Select an ATM from the network to view AI-driven predictions and insights.</p>
          </div>
        ) : predLoading ? (
          <div className="glass-card h-64 flex items-center justify-center">
             <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
          </div>
        ) : prediction ? (
          <div className="glass-card p-6 overflow-hidden relative">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-50 rounded-full mix-blend-multiply opacity-50"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Insight Report</h4>
                <p className="text-xs text-gray-500">ATM #{prediction.atm_id} • Next 24h</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Predicted Demand</p>
              <p className="text-3xl font-bold text-gray-900">Rs. {prediction.predicted_demand.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">LLM Explanation</p>
              <div className="bg-brand-50 border-l-4 border-brand-500 p-4 rounded-r-xl">
                <p className="text-brand-900 text-sm leading-relaxed font-medium">
                  "{prediction.llm_explanation}"
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/refill-map')}
              className="w-full mt-6 bg-gray-900 hover:bg-black text-white font-medium py-2.5 rounded-xl transition-colors text-sm shadow-md"
            >
              Schedule Refill →
            </button>
          </div>
        ) : null}
      </div>

    </div>
  );
}

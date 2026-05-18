import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsService } from '../services/api';
import { Calendar, AlertCircle, Moon, Star, Flag, Trophy, TrendingUp, ShieldAlert, Truck, CheckCircle } from 'lucide-react';

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedulingEventId, setSchedulingEventId] = useState(null);
  const [expandedPlans, setExpandedPlans] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, plansRes] = await Promise.all([
        eventsService.getUpcoming(),
        eventsService.getManagementPlan()
      ]);
      setEvents(eventsRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (eventId) => {
    try {
      setSchedulingEventId(eventId);
      await eventsService.scheduleEvent(eventId);
      // After successfully scheduling, navigate to live reports
      navigate('/refill-reports');
    } catch (err) {
      console.error("Failed to schedule event", err);
      alert("Error scheduling event. Please try again.");
      setSchedulingEventId(null);
    }
  };

  const togglePlan = (eventId) => {
    setExpandedPlans(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'moon': return Moon;
      case 'star': return Star;
      case 'flag': return Flag;
      case 'trophy': return Trophy;
      default: return Calendar;
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'Very High': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) return <div className="text-center p-12 text-gray-500">Loading events and management plans...</div>;

  return (
    <div className="space-y-8">
      {/* Management Plans Section */}
      {plans.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-red-500" /> 
                Active Event Management Plans
              </h2>
              <p className="text-gray-500 mt-1">Auto-generated refill strategies for high-impact events currently active.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <h3 className="font-bold text-lg text-red-900">{plan.event_name} Management Plan</h3>
                      <p className="text-sm text-red-700">Demand Multiplier: {plan.demand_multiplier}x</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-sm text-red-700 font-medium">Total Cash Required</p>
                    <p className="text-xl font-bold text-red-900">PKR {plan.total_estimated_cash_required.toLocaleString()}</p>
                    <button 
                      onClick={() => togglePlan(plan.event_id)}
                      className="text-xs px-3 py-1 bg-white text-red-600 border border-red-200 rounded-full hover:bg-red-50 font-semibold"
                    >
                      {expandedPlans[plan.event_id] ? 'Hide Management Plan' : 'View Management Plan'}
                    </button>
                  </div>
                </div>
                
                {expandedPlans[plan.event_id] && (
                  <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Affected ATMs Requiring Pre-Refill</h4>
                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 text-sm text-gray-600">
                            <th className="p-3 font-semibold">ATM Location</th>
                            <th className="p-3 font-semibold">Current Cash</th>
                            <th className="p-3 font-semibold">Predicted Demand</th>
                            <th className="p-3 font-semibold">Urgency</th>
                            <th className="p-3 font-semibold text-right">Recommended Refill</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {plan.affected_atms.map((atm, j) => (
                            <tr key={j} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-900">{atm.location}</td>
                              <td className="p-3 text-gray-600">PKR {atm.current_cash.toLocaleString()}</td>
                              <td className="p-3 text-brand-600 font-medium">PKR {atm.predicted_demand.toLocaleString()}</td>
                              <td className="p-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  atm.refill_urgency === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {atm.refill_urgency}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-gray-900 flex items-center justify-end gap-2">
                                <Truck className="w-4 h-4 text-gray-400" />
                                PKR {atm.recommended_refill.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {plan.affected_atms.length === 0 && (
                            <tr>
                              <td colSpan="5" className="p-4 text-center text-gray-500 italic">No ATMs currently require pre-refill for this event.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleSchedule(plan.event_id)}
                        disabled={schedulingEventId === plan.event_id || plan.affected_atms.length === 0}
                        className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow shadow-red-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {schedulingEventId === plan.event_id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {schedulingEventId === plan.event_id ? 'Scheduling...' : 'Schedule Complete Event Refill'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pakistan National Events</h1>
            <p className="text-gray-500 mt-1">Upcoming events and their projected impact on ATM cash demand in Karachi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => {
            const Icon = getIcon(event.icon);
            return (
              <div key={i} className="glass-card p-6 flex flex-col h-full border-t-4 hover:-translate-y-1 transition-transform" 
                   style={{ borderTopColor: event.impact === 'Very High' ? '#a855f7' : event.impact === 'High' ? '#ef4444' : event.impact === 'Medium' ? '#f59e0b' : '#3b82f6' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{event.name}</h3>
                      <p className="text-sm font-medium text-brand-600">{event.date_range}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 flex-grow">{event.description}</p>
                
                <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Impact Level</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getImpactColor(event.impact)}`}>
                      {event.impact}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Demand Spike</p>
                    <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                      <TrendingUp className="w-4 h-4 text-brand-600" />
                      {event.demand_multiplier}x
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

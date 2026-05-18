import { useState, useEffect, useRef } from 'react';
import { refillService, atmService } from '../services/api';
import { Truck, MapPin, Clock, CheckCircle, Navigation, Fuel } from 'lucide-react';

export default function RefillMap() {
  const [atms, setAtms] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [targetAtm, setTargetAtm] = useState(null);
  const [eta, setEta] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const vehicleMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  useEffect(() => {
    fetchAtms();
    fetchVehicleStatus();
  }, []);

  // Poll vehicle position when en route
  useEffect(() => {
    if (vehicle?.status === 'En Route') {
      const interval = setInterval(() => {
        fetchVehicleStatus();
        setPollCount(c => c + 1);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [vehicle?.status]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([24.8607, 67.0011], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when atms or vehicle changes
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear old ATM markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // ATM markers
    atms.forEach(atm => {
      if (atm.latitude && atm.longitude) {
        const isLow = atm.status === 'Low Cash';
        const isTarget = vehicle?.target_atm_id === atm.id;

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width:${isTarget ? '36px' : '28px'};
            height:${isTarget ? '36px' : '28px'};
            border-radius:50%;
            background:${isTarget ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'};
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:bold;font-size:${isTarget ? '13px' : '11px'};
            ${isTarget ? 'animation:pulse 1.5s infinite;' : ''}
          ">${atm.id}</div>`,
          iconSize: [isTarget ? 36 : 28, isTarget ? 36 : 28],
          iconAnchor: [isTarget ? 18 : 14, isTarget ? 18 : 14],
        });

        const marker = L.marker([atm.latitude, atm.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:160px;">
              <strong style="font-size:14px;">ATM #${atm.id}</strong><br/>
              <span style="color:#666;font-size:12px;">${atm.location}</span><br/>
              <span style="font-size:13px;font-weight:600;color:${isLow ? '#ef4444' : '#10b981'}">
                Rs. ${atm.current_cash.toLocaleString()}
              </span><br/>
              <span style="font-size:11px;padding:2px 6px;border-radius:8px;background:${isLow ? '#fef2f2' : '#f0fdf4'};color:${isLow ? '#dc2626' : '#16a34a'}">
                ${atm.status}
              </span>
            </div>
          `);
        markersRef.current.push(marker);
      }
    });

    // Vehicle marker
    if (vehicle) {
      if (vehicleMarkerRef.current) {
        map.removeLayer(vehicleMarkerRef.current);
      }

      const truckIcon = L.divIcon({
        className: 'truck-marker',
        html: `<div style="
          width:40px;height:40px;border-radius:50%;
          background:linear-gradient(135deg,#3b82f6,#1d4ed8);
          border:3px solid white;box-shadow:0 4px 12px rgba(59,130,246,0.5);
          display:flex;align-items:center;justify-content:center;
          font-size:18px;
        ">🚐</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      vehicleMarkerRef.current = L.marker([vehicle.latitude, vehicle.longitude], { icon: truckIcon })
        .addTo(map)
        .bindPopup(`<strong>Refill Truck</strong><br/>Status: ${vehicle.status}`);

      // Draw route line if en route
      if (routeLineRef.current) map.removeLayer(routeLineRef.current);
      if (vehicle.status === 'En Route' && targetAtm) {
        routeLineRef.current = L.polyline(
          [[vehicle.latitude, vehicle.longitude], [targetAtm.latitude, targetAtm.longitude]],
          { color: '#3b82f6', weight: 3, dashArray: '8, 8', opacity: 0.7 }
        ).addTo(map);
      }
    }
  }, [atms, vehicle, targetAtm, pollCount]);

  const fetchAtms = async () => {
    try {
      const res = await atmService.getAtms();
      setAtms(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchVehicleStatus = async () => {
    try {
      const res = await refillService.getStatus();
      setVehicle(res.data);

      if (res.data.target_atm_id) {
        const atmsRes = await atmService.getAtms();
        const target = atmsRes.data.find(a => a.id === res.data.target_atm_id);
        setTargetAtm(target);
        if (target) {
          const dist = getDistance(res.data.latitude, res.data.longitude, target.latitude, target.longitude);
          setEta(Math.max(1, Math.round(dist / 0.5))); // ~30km/h in city
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleDispatch = async () => {
    setDispatching(true);
    try {
      const res = await refillService.dispatch();
      setVehicle(res.data);
      await fetchAtms();
      await fetchVehicleStatus();
    } catch (err) {
      alert(err.response?.data?.detail || 'No ATMs need refilling');
    } finally {
      setDispatching(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await refillService.complete();
      await fetchAtms();
      await fetchVehicleStatus();
      setTargetAtm(null);
      setEta(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Cannot complete');
    } finally {
      setCompleting(false);
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${vehicle?.status === 'En Route' ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Truck className={`w-6 h-6 ${vehicle?.status === 'En Route' ? 'text-blue-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Vehicle Status</p>
            <p className={`text-lg font-bold ${vehicle?.status === 'En Route' ? 'text-blue-600' : 'text-gray-900'}`}>
              {vehicle?.status || 'Loading...'}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-red-50">
            <MapPin className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Target ATM</p>
            <p className="text-lg font-bold text-gray-900">
              {targetAtm ? `ATM #${targetAtm.id}` : 'None'}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Estimated ETA</p>
            <p className="text-lg font-bold text-gray-900">
              {eta ? `~${eta} min` : '—'}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-green-50">
            <Fuel className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Refill Amount</p>
            <p className="text-lg font-bold text-gray-900">
              {targetAtm ? `Rs. ${(5000000 - targetAtm.current_cash).toLocaleString()}` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDispatch}
          disabled={dispatching || vehicle?.status === 'En Route'}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          {dispatching ? 'Dispatching...' : 'Dispatch to Nearest ATM'}
        </button>

        {vehicle?.status === 'En Route' && (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all shadow-lg shadow-green-200 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {completing ? 'Completing...' : 'Complete Refill'}
          </button>
        )}
      </div>

      {/* Map */}
      <div className="glass-card overflow-hidden" style={{ height: '500px' }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* ATM Status Summary Below Map */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {atms.slice(0, 10).map(atm => (
          <div key={atm.id} className={`glass-card p-4 text-center ${atm.status === 'Low Cash' ? 'border-red-200 bg-red-50/50' : ''}`}>
            <p className="text-xs text-gray-500">ATM #{atm.id}</p>
            <p className={`text-base font-bold mt-1 ${atm.current_cash < 10000 ? 'text-red-600' : 'text-gray-900'}`}>
              Rs. {atm.current_cash.toLocaleString()}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
              atm.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>{atm.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

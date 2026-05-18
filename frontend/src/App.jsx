import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AtmMonitoring from './pages/AtmMonitoring';
import RefillMap from './pages/RefillMap';
import RefillReports from './pages/RefillReports';
import DataAnalysis from './pages/DataAnalysis';
import MainLayout from './layouts/MainLayout';
import Events from './pages/Events';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="monitoring" element={<AtmMonitoring />} />
          <Route path="refill-map" element={<RefillMap />} />
          <Route path="refill-reports" element={<RefillReports />} />
          <Route path="data-analysis" element={<DataAnalysis />} />
          <Route path="events" element={<Events />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

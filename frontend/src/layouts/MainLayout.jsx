import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, LogOut, Activity, MapPin, FileText, Brain, Calendar } from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'ATM Monitoring', path: '/monitoring', icon: CreditCard },
    { name: 'Live Refill Map', path: '/refill-map', icon: MapPin },
    { name: 'Refill Reports', path: '/refill-reports', icon: FileText },
    { name: 'Data Analysis', path: '/data-analysis', icon: Brain },
    { name: 'National Events', path: '/events', icon: Calendar },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-brand-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <Activity className="w-8 h-8 text-brand-500" />
          <h1 className="text-xl font-bold tracking-tight">Smart ATM</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-600 shadow-md' 
                    : 'hover:bg-brand-800 text-brand-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-brand-800 text-brand-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-8 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {location.pathname.replace('/', '').replace(/-/g, ' ')}
          </h2>
        </header>
        
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

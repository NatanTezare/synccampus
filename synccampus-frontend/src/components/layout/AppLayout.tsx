import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { User } from '../../api/types';
import { BusIcon, BuildingIcon, CalendarIcon, TicketIcon } from '../icons';

const PAGE_TITLES: Record<string, string> = {
  '/shuttle': 'Shuttle Booking',
  '/venues': 'Venue Booking & Triage',
  '/appointments': 'Book Appointment',
  '/faculty/dashboard': 'Faculty Dashboard',
  '/tickets': 'My Tickets',
};

const ROLE_LABELS: Record<User['role'], string> = {
  student: 'Student',
  faculty_leadership: 'Faculty / Leadership',
  admin: 'Admin',
};

const DEMO_USER: User = {
  id: 'demo-user',
  full_name: 'Amani Otieno',
  email: 'amani.otieno@usiu.ac.ke',
  role: 'student',
  title: null,
  department: 'Information Technology',
  student_id_no: 'USIU-2024-0417',
  phone_number: null,
};

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the actual logged-in user
  const user = authService.getStoredUser() ?? DEMO_USER;
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'SyncCampus';

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

 // DYNAMIC NAVIGATION: Changes based on the user's role!
  const getNavItems = () => {
    const items = [
      { to: '/shuttle', label: 'Shuttle', icon: BusIcon },
    ];

    // If Admin, they get the Triage dashboard instead of standard booking
    if (user.role === 'admin') {
      items.push({ to: '/admin/venues', label: 'Venue Triage', icon: BuildingIcon });
    } else {
      items.push({ to: '/venues', label: 'Venues', icon: BuildingIcon });
    }

    // If Faculty, they get the Dashboard. If Student, they get standard Appointments.
    if (user.role === 'faculty_leadership') {
      items.push({ to: '/faculty/dashboard', label: 'My Schedule', icon: CalendarIcon });
    } else if (user.role === 'student') {
      items.push({ to: '/appointments', label: 'Appointments', icon: CalendarIcon });
    }

    // Everyone gets their ticket wallet
    items.push({ to: '/tickets', label: 'My Tickets', icon: TicketIcon });

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-twilight text-alice font-body">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 left-0 border-r border-twilight-border bg-twilight-surface/60 backdrop-blur-sm z-20">
        <div className="h-20 flex items-center gap-3 px-6 border-b border-twilight-border">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-usiu-blue to-usiu-blue-dark flex items-center justify-center shadow-glow shrink-0">
            <span className="font-display font-bold text-lg leading-none">S</span>
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-display font-semibold tracking-tight truncate">SyncCampus</p>
            <p className="text-[11px] text-alice-muted uppercase tracking-wider truncate">USIU-Africa Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium min-h-[48px] transition-colors duration-150 border ${
                  isActive
                    ? 'bg-usiu-blue/15 border-usiu-blue/40 text-alice shadow-[inset_3px_0_0_0_theme(colors.gold.DEFAULT)]'
                    : 'border-transparent text-alice-muted hover:bg-twilight-surface-hover hover:text-alice active:scale-[0.98]'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-twilight-border">
          <div className="flex flex-col gap-2 px-2 py-2.5 rounded-xl bg-twilight-surface-hover">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gold flex items-center justify-center text-twilight font-display font-semibold text-sm shrink-0">
                {initialsOf(user.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-xs text-alice-muted truncate">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="mt-2 w-full text-center text-xs font-semibold text-red-400 hover:text-red-300 transition-colors py-1.5 border border-red-900/50 rounded-lg bg-red-900/10 hover:bg-red-900/20"
            >
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="md:ml-64 flex flex-col min-h-screen pb-[76px] md:pb-0">
        <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 md:px-8 border-b border-twilight-border bg-twilight/85 backdrop-blur-sm">
          <h1 className="font-display font-semibold text-lg tracking-tight">{pageTitle}</h1>
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={handleLogout} className="text-xs text-red-400 font-semibold">Logout</button>
            <div className="h-8 w-8 rounded-full bg-gold flex items-center justify-center text-twilight font-display font-semibold text-xs">
              {initialsOf(user.full_name)}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-10">
          <div className="max-w-3xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-[76px] bg-twilight-surface border-t border-twilight-border flex items-stretch z-20">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] text-xs font-medium transition-colors active:bg-twilight-surface-hover ${
                isActive ? 'text-gold' : 'text-alice-muted'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
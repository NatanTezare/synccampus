import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { authService } from '../../services/authService';
import type { User } from '../../api/types';
import { useTheme } from '../../theme/useTheme';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  BusIcon,
  BuildingIcon,
  CalendarIcon,
  TicketIcon,
  SunIcon,
  MoonIcon,
  VolumeIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
} from '../icons';

const PAGE_TITLES: Record<string, string> = {
  '/shuttle': 'Shuttle Booking',
  '/venues': 'Venue Booking & Triage',
  '/appointments': 'Book Appointment',
  '/faculty/dashboard': 'Faculty Dashboard',
  '/tickets': 'My Tickets',
  '/admin/venues': 'Venue Triage',
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

function Crest({ size = 40, amber }: { size?: number; amber: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <path d="M26 5L45 17V21H7V17L26 5Z" fill={amber} />
      <rect x="11" y="23" width="6" height="18" rx="2" fill="white" opacity="0.95" />
      <rect x="23" y="23" width="6" height="18" rx="2" fill="white" opacity="0.95" />
      <rect x="35" y="23" width="6" height="18" rx="2" fill="white" opacity="0.95" />
      <rect x="7" y="41" width="38" height="5" rx="2" fill="white" />
    </svg>
  );
}

// Icon-button styling shared by every control in the toolbar
function toolbarBtnStyle(active: boolean, C: ReturnType<typeof useTheme>) {
  return {
    background: active ? C.blue : C.aliceLight,
    color: active ? '#fff' : C.charcoal,
  };
}

function AccessibilityToolbar({ C }: { C: ReturnType<typeof useTheme> }) {
  const {
    mode,
    toggleMode,
    fontScaleLabel,
    increaseFontScale,
    decreaseFontScale,
    canIncreaseFontScale,
    canDecreaseFontScale,
    isSpeaking,
    isPaused,
    speakPage,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
  } = useAccessibility();

  return (
    <div className="flex items-center gap-1.5" role="toolbar" aria-label="Accessibility controls">
      <button
        onClick={decreaseFontScale}
        disabled={!canDecreaseFontScale}
        aria-label="Decrease text size"
        title="Decrease text size"
        className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold disabled:opacity-40 transition-colors"
        style={toolbarBtnStyle(false, C)}
      >
        A−
      </button>
      <span className="text-[10px] font-semibold w-9 text-center shrink-0" style={{ color: C.charcoal }} aria-live="polite">
        {fontScaleLabel}
      </span>
      <button
        onClick={increaseFontScale}
        disabled={!canIncreaseFontScale}
        aria-label="Increase text size"
        title="Increase text size"
        className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold disabled:opacity-40 transition-colors"
        style={toolbarBtnStyle(false, C)}
      >
        A+
      </button>

      <button
        onClick={toggleMode}
        aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
        style={toolbarBtnStyle(false, C)}
      >
        {mode === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      </button>

      {!isSpeaking ? (
        <button
          onClick={speakPage}
          aria-label="Read page aloud"
          title="Read page aloud"
          className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
          style={toolbarBtnStyle(false, C)}
        >
          <VolumeIcon className="h-4 w-4" />
        </button>
      ) : (
        <>
          <button
            onClick={isPaused ? resumeSpeech : pauseSpeech}
            aria-label={isPaused ? 'Resume reading' : 'Pause reading'}
            title={isPaused ? 'Resume reading' : 'Pause reading'}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={toolbarBtnStyle(true, C)}
          >
            {isPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
          </button>
          <button
            onClick={stopSpeech}
            aria-label="Stop reading"
            title="Stop reading"
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={toolbarBtnStyle(false, C)}
          >
            <StopIcon className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const C = useTheme();
  const { stopSpeech } = useAccessibility();

  const user = authService.getStoredUser() ?? DEMO_USER;
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'CBMS';

  // Reading the previous page aloud shouldn't continue once its content is gone
  useEffect(() => {
    stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getNavItems = () => {
    // 1. ADMIN: Strictly gets Venue Triage ONLY (No tickets, shuttle, or appointments)
    if (user.role === 'admin') {
      return [
        { to: '/admin/venues', label: 'Venue Triage', icon: BuildingIcon },
      ];
    }

    // 2. STUDENTS & FACULTY: Unchanged
    const items = [{ to: '/shuttle', label: 'Shuttle', icon: BusIcon }];
    items.push({ to: '/venues', label: 'Venues', icon: BuildingIcon });

    if (user.role === 'faculty_leadership') {
      items.push({ to: '/faculty/dashboard', label: 'My Schedule', icon: CalendarIcon });
    } else if (user.role === 'student') {
      items.push({ to: '/appointments', label: 'Appointments', icon: CalendarIcon });
    }

    items.push({ to: '/tickets', label: 'My Tickets', icon: TicketIcon });
    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen font-body" style={{ background: C.aliceLight, color: C.dark }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 left-0 z-20" style={{ background: C.surface, borderRight: `1px solid ${C.border}` }}>
        <div className="h-20 flex items-center gap-3 px-6" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(145deg, ${C.blue} 0%, #4A5BC4 100%)`, boxShadow: '0 4px 14px rgba(43,57,144,0.3)' }}
          >
            <Crest size={26} amber={C.amber} />
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-display font-bold tracking-tight truncate" style={{ color: C.blue }}>CBMS</p>
            <p className="text-[11px] uppercase tracking-wider truncate" style={{ color: C.charcoal }}>USIU-Africa Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold min-h-[48px] transition-colors duration-150 relative"
              style={({ isActive }) => ({
                background: isActive ? 'rgba(43,57,144,0.1)' : 'transparent',
                color: isActive ? C.blue : C.charcoal,
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full" style={{ background: C.amber }} />
                  )}
                  <Icon className="h-5 w-5 shrink-0" style={{ color: isActive ? C.blue : C.charcoal }} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="flex flex-col gap-2.5 px-3 py-3 rounded-xl" style={{ background: C.aliceLight }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0" style={{ background: C.amber, color: '#1a1c2e' }}>
                {initialsOf(user.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: C.dark }}>{user.full_name}</p>
                <p className="text-xs truncate" style={{ color: C.charcoal }}>{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-center text-xs font-bold py-1.5 rounded-lg transition-colors"
              style={{ color: C.danger, background: 'rgba(227,24,24,0.1)', border: '1px solid rgba(227,24,24,0.25)' }}
            >
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="md:ml-64 flex flex-col min-h-screen pb-[76px] md:pb-0">
        <header
          className="sticky top-0 z-10 h-16 flex items-center justify-between gap-3 px-4 md:px-8 backdrop-blur-sm"
          style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}` }}
        >
          <h1 className="font-display font-bold text-lg tracking-tight truncate" style={{ color: C.dark }}>{pageTitle}</h1>

          <div className="flex items-center gap-3 shrink-0">
            <AccessibilityToolbar C={C} />

            <div className="hidden md:block h-6 w-px" style={{ background: C.border }} />

            <div className="flex items-center gap-2 md:hidden">
              <button onClick={handleLogout} className="text-xs font-bold" style={{ color: C.danger }}>Logout</button>
              <div className="h-8 w-8 rounded-full flex items-center justify-center font-display font-bold text-xs" style={{ background: C.amber, color: '#1a1c2e' }}>
                {initialsOf(user.full_name)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-10 w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 h-[76px] flex items-stretch z-20"
        style={{ background: C.surface, borderTop: `1px solid ${C.border}`, boxShadow: '0 -4px 20px rgba(43,57,144,0.08)' }}
      >
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] relative">
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-[3px]" style={{ background: C.amber }} />}
                <Icon className="h-5 w-5" style={{ color: isActive ? C.blue : C.charcoal }} />
                <span className="text-[10px] font-semibold" style={{ color: isActive ? C.blue : C.charcoal }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
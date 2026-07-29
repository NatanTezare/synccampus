import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Auth from './screens/Auth';
import Screen2Shuttle from './screens/Screen2Shuttle';
import AdminVenueTriage from './screens/AdminVenueTriage';
import VenueBooking from './screens/VenueBooking';
import Appointments from './screens/Appointments';
import MyTickets from './screens/MyTickets';
import FacultyDashboard from './screens/FacultyDashboard';
import { AccessibilityProvider } from './context/AccessibilityContext';

export default function App() {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/login" element={<Auth />} />
            <Route index element={<Navigate to="/shuttle" replace />} />
            <Route path="/shuttle" element={<Screen2Shuttle />} />
            <Route path="/venues" element={<VenueBooking />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/admin/venues" element={<AdminVenueTriage />} />
            <Route path="/tickets" element={<MyTickets />} />
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="*" element={<Navigate to="/shuttle" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AccessibilityProvider>
  );
}
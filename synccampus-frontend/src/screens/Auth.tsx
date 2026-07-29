import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { RegisterPayload, LoginPayload } from '../services/authService';
import type { UserRole, FacultyTitle } from '../api/types';
import { useTheme } from '../theme/useTheme';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Auth() {
  const navigate = useNavigate();
  const C = useTheme();
  const { mode } = useAccessibility();

  const pageBg =
    mode === 'dark'
      ? 'linear-gradient(165deg, #0e1226 0%, #161b33 35%, #1b2140 65%, #10142a 100%)'
      : 'linear-gradient(165deg, #c5dcf7 0%, #d8ecff 35%, #E8F4FF 65%, #f0f7ff 100%)';

  const [isLogin, setIsLogin] = useState(true);
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [studentIdNo, setStudentIdNo] = useState('');
  const [title, setTitle] = useState<FacultyTitle | ''>('');
  const [department, setDepartment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const payload: LoginPayload = { email, password };
        await authService.login(payload);
      } else {
        const payload: RegisterPayload = {
          fullName,
          email,
          password,
          role,
          ...(role === 'student' && { studentIdNo }),
          ...(role === 'faculty_leadership' && { title: title || undefined, department })
        };
        await authService.register(payload);
      }
      
      // Get the newly authenticated user
      const user = authService.getStoredUser();

      // Route the admin to Venue Triage, and everyone else to the shuttle dashboard
      if (user?.role === 'admin') {
        navigate('/admin/venues');
      } else {
        navigate('/shuttle');
      }
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputWrapperStyle = { background: C.aliceLight };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto" style={{ background: pageBg }}>
      <div className="absolute bottom-10 left-[-80px] w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'rgba(255,203,5,0.07)' }} />

      <div className="w-full max-w-md z-0 flex flex-col gap-4">
        {/* Branding card */}
        <div
          className="rounded-[20px] px-5 pt-6 pb-5 flex flex-col items-center gap-3 relative overflow-hidden"
          style={{ background: C.surface, boxShadow: '0 8px 32px rgba(43,57,144,0.12), 0 2px 6px rgba(0,0,0,0.04)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${C.blue} 0%, ${C.amber} 100%)` }} />

          <div
            className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center"
            style={{ background: `linear-gradient(145deg, #2B3990 0%, #3d4fbe 60%, #4A5BC4 100%)`, boxShadow: '0 6px 18px rgba(43,57,144,0.25), inset 0 1px 0 rgba(255,255,255,0.15)' }}
          >
            <svg width="42" height="42" viewBox="0 0 52 52" fill="none">
              <path d="M26 5L45 17V21H7V17L26 5Z" fill="#FFCB05" />
              <rect x="11" y="23" width="6" height="18" rx="2" fill="white" opacity="0.95" />
              <rect x="23" y="23" width="6" height="18" rx="2" fill="white" opacity="0.95" />
              <rect x="35" y="23" width="6" height="18" rx="2" fill="white" opacity="0.95" />
              <rect x="7" y="41" width="38" height="5" rx="2" fill="white" />
              <rect x="5" y="46" width="42" height="3" rx="1.5" fill="rgba(255,255,255,0.5)" />
            </svg>
          </div>

          <div className="text-center flex flex-col gap-0.5">
            <div className="text-[21px] font-[800] tracking-[-0.01em] leading-[1.1]" style={{ color: C.blue }}>CBMS</div>
            <div className="text-[11px] font-[600] tracking-[0.14em] uppercase" style={{ color: C.charcoal }}>USIU-Africa Portal</div>
          </div>
        </div>

        {/* Login/Signup panel */}
        <div className="rounded-[20px] p-5 md:p-6 flex flex-col gap-4" style={{ background: C.surface, boxShadow: '0 4px 20px rgba(43,57,144,0.06)' }}>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[18px] font-[800] tracking-[-0.02em]" style={{ color: C.dark }}>
                {isLogin ? 'Welcome back' : 'Create Account'}
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: C.charcoal }}>
                {isLogin ? 'Sign in with your credentials' : 'Join the campus platform'}
              </div>
            </div>
          </div>

          <div className="flex rounded-xl p-1 border" style={{ background: C.aliceLight, borderColor: C.border }}>
            <button
              type="button"
              className="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all"
              style={isLogin ? { background: C.blue, color: '#fff' } : { color: C.charcoal }}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Log In
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all"
              style={!isLogin ? { background: C.blue, color: '#fff' } : { color: C.charcoal }}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold text-center" style={{ background: 'rgba(227,24,24,0.1)', color: C.danger, border: '1px solid rgba(227,24,24,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-[700] uppercase tracking-[0.05em]" style={{ color: C.charcoal }}>Full Name</label>
                <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all" style={inputWrapperStyle}>
                  <input
                    type="text" required placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[13px]" style={{ color: C.dark }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-[700] uppercase tracking-[0.05em]" style={{ color: C.charcoal }}>University Email</label>
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all" style={inputWrapperStyle}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4.5A1.5 1.5 0 013.5 3h11A1.5 1.5 0 0116 4.5v9A1.5 1.5 0 0114.5 15h-11A1.5 1.5 0 012 13.5v-9z" stroke={C.charcoal} strokeWidth="1.5" />
                  <path d="M2 5l7 5 7-5" stroke={C.charcoal} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="email" required placeholder="student@usiu.ac.ke" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[13px]" style={{ color: C.dark }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-[700] uppercase tracking-[0.05em]" style={{ color: C.charcoal }}>Password</label>
                {isLogin && (
                  <button type="button" className="bg-none border-none text-[11px] font-[600] cursor-pointer hover:underline" style={{ color: C.blue }}>
                    Forgot?
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all" style={inputWrapperStyle}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <rect x="3" y="8" width="12" height="8" rx="2" stroke={C.charcoal} strokeWidth="1.5" />
                  <path d="M6 8V6.5a3 3 0 016 0V8" stroke={C.charcoal} strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="9" cy="12" r="1.5" fill={C.charcoal} />
                </svg>
                <input
                  type={showPw ? 'text' : 'password'} required placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[13px]" style={{ color: C.dark }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="bg-none border-none cursor-pointer p-0 transition-colors" style={{ color: C.charcoal }}>
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M1.5 9s3-6 7.5-6 7.5 6 7.5 6-3 6-7.5 6-7.5-6-7.5-6z" stroke="currentColor" strokeWidth="1.4" /><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M2.5 2.5l13 13M7.4 7.5A2.5 2.5 0 0011.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M4 4.6C2.4 5.8 1.5 9 1.5 9s3 6 7.5 6c1.5 0 2.9-.4 4.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M6.5 3.3C7.3 3.1 8.1 3 9 3c4.5 0 7.5 6 7.5 6s-.7 1.4-2 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-[700] uppercase tracking-[0.05em]" style={{ color: C.charcoal }}>I am a...</label>
                  <select
                    value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-xl px-3.5 py-3 outline-none text-[13px] border-2 border-transparent transition-all cursor-pointer"
                    style={{ background: C.aliceLight, color: C.dark }}
                  >
                    <option value="student">Student</option>
                    <option value="faculty_leadership">Faculty / Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {role === 'student' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-[700] uppercase tracking-[0.05em]" style={{ color: C.charcoal }}>Student ID Number</label>
                    <div className="flex items-center rounded-xl px-3.5 py-2.5 transition-all" style={inputWrapperStyle}>
                      <input
                        type="text" required placeholder="e.g. USIU-2024-0417" value={studentIdNo} onChange={(e) => setStudentIdNo(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-[13px]" style={{ color: C.dark }}
                      />
                    </div>
                  </div>
                )}

                {role === 'faculty_leadership' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-[700] uppercase tracking-[0.05em] truncate" style={{ color: C.charcoal }}>Title</label>
                      <select
                        value={title} onChange={(e) => setTitle(e.target.value as FacultyTitle)} required
                        className="w-full rounded-xl px-3 py-2.5 outline-none text-[13px] border-2 border-transparent"
                        style={{ background: C.aliceLight, color: C.dark }}
                      >
                        <option value="">-- Select --</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="hod">HOD</option>
                        <option value="vc">VC</option>
                        <option value="staff">Staff</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-[700] uppercase tracking-[0.05em] truncate" style={{ color: C.charcoal }}>Department</label>
                      <input
                        type="text" required placeholder="IT" value={department} onChange={(e) => setDepartment(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 outline-none text-[13px] border-2 border-transparent"
                        style={{ background: C.aliceLight, color: C.dark }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 text-white border-none rounded-xl p-3.5 text-[14px] font-[700] cursor-pointer flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${C.blue} 0%, #3d4fbe 100%)`, boxShadow: '0 4px 14px rgba(43,57,144,0.25)' }}
            >
              {loading ? 'Processing...' : isLogin ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M7 3H3.5A1.5 1.5 0 002 4.5v9A1.5 1.5 0 003.5 15H7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M12 12l4-3-4-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 9H7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Login to Portal
                </>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="py-2 text-center text-[10px] opacity-50 font-medium" style={{ color: C.charcoal }}>
          © 2026 SyncCampus Management System
        </div>
      </div>
    </div>
  );
}
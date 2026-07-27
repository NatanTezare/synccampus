import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { RegisterPayload, LoginPayload } from '../services/authService';
import type { UserRole, FacultyTitle } from '../api/types';

const C = {
  blue: "#2B3990",
  amber: "#FFCB05",
  amberDark: "#D4A500",
  alice: "#E8F4FF",
  aliceLight: "#F3F9FF",
  charcoal: "#54566A",
};

export default function Auth() {
  const navigate = useNavigate();
  
  // Toggle state between Login and Register
  const [isLogin, setIsLogin] = useState(true);
  const [showPw, setShowPw] = useState(false);
  
  // Universal state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Shared Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register-only Form State
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
      navigate('/shuttle');
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto"
      style={{ background: `linear-gradient(165deg, #c5dcf7 0%, #d8ecff 35%, #E8F4FF 65%, #f0f7ff 100%)` }}
    >
      {/* Decorative background orb */}
      <div 
        className="absolute bottom-10 left-[-80px] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "rgba(255,203,5,0.07)" }}
      />

      <div className="w-full max-w-md z-0 flex flex-col gap-4">
        
        {/* University Branding Card */}
        <div className="bg-white rounded-[20px] px-5 pt-6 pb-5 shadow-[0_8px_32px_rgba(43,57,144,0.12),0_2px_6px_rgba(0,0,0,0.04)] flex flex-col items-center gap-3 relative overflow-hidden">
          {/* Brand Accent Bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, ${C.blue} 0%, ${C.amber} 100%)` }}
          />

          {/* Logo Crest Framework */}
          <div className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center shadow-[0_6px_18px_rgba(43,57,144,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]"
               style={{ background: `linear-gradient(145deg, #2B3990 0%, #3d4fbe 60%, #4A5BC4 100%)` }}>
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
            <div className="text-[21px] font-[800] tracking-[-0.01em] leading-[1.1]" style={{ color: C.blue }}>
              CBMS
            </div>
            <div className="text-[11px] font-[600] tracking-[0.14em] uppercase" style={{ color: C.charcoal }}>
              USIU-Africa Portal
            </div>
          </div>
        </div>

        {/* Login/Signup Input Panel */}
        <div className="bg-white rounded-[20px] p-5 md:p-6 shadow-[0_4px_20px_rgba(43,57,144,0.06)] flex flex-col gap-4">
          
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[18px] font-[800] text-[#1A1B2F] tracking-[-0.02em]">
                {isLogin ? 'Welcome back' : 'Create Account'}
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: C.charcoal }}>
                {isLogin ? 'Sign in with your credentials' : 'Join the campus platform'}
              </div>
            </div>
          </div>

          {/* Toggle Tabs */}
          <div className="flex rounded-xl p-1 border" style={{ background: C.aliceLight, borderColor: 'rgba(43,57,144,0.08)' }}>
            <button 
              type="button"
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${isLogin ? 'shadow' : 'hover:opacity-80'}`}
              style={isLogin ? { background: C.blue, color: '#fff' } : { color: C.charcoal }}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Log In
            </button>
            <button 
              type="button"
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${!isLogin ? 'shadow' : 'hover:opacity-80'}`}
              style={!isLogin ? { background: C.blue, color: '#fff' } : { color: C.charcoal }}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-[700] uppercase tracking-[0.05em]" style={{ color: C.charcoal }}>Full Name</label>
                <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all focus-within:shadow-[0_0_0_3px_rgba(43,57,144,0.08)] border-2 border-transparent focus-within:bg-white"
                     style={{ background: C.aliceLight }}>
                  <input type="text" required placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)}
                         className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1A1B2F] placeholder-[#9AABCC]" />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-[700] uppercase tracking-[0.05em]" style={{ color: C.charcoal }}>University Email</label>
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all focus-within:shadow-[0_0_0_3px_rgba(43,57,144,0.08)] border-2 border-transparent focus-within:bg-white focus-within:border-[#2B3990]"
                   style={{ background: C.aliceLight }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4.5A1.5 1.5 0 013.5 3h11A1.5 1.5 0 0116 4.5v9A1.5 1.5 0 0114.5 15h-11A1.5 1.5 0 012 13.5v-9z" stroke="#9AABCC" strokeWidth="1.5" />
                  <path d="M2 5l7 5 7-5" stroke="#9AABCC" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input type="email" required placeholder="student@usiu.ac.ke" value={email} onChange={e => setEmail(e.target.value)}
                       className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1A1B2F] placeholder-[#9AABCC]" />
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
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all focus-within:shadow-[0_0_0_3px_rgba(43,57,144,0.08)] border-2 border-transparent focus-within:bg-white focus-within:border-[#2B3990]"
                   style={{ background: C.aliceLight }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <rect x="3" y="8" width="12" height="8" rx="2" stroke="#9AABCC" strokeWidth="1.5" />
                  <path d="M6 8V6.5a3 3 0 016 0V8" stroke="#9AABCC" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="9" cy="12" r="1.5" fill="#9AABCC" />
                </svg>
                <input type={showPw ? "text" : "password"} required placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)}
                       className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1A1B2F] placeholder-[#9AABCC]" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="bg-none border-none cursor-pointer p-0 text-[#9AABCC] hover:text-[#2B3990] transition-colors">
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M1.5 9s3-6 7.5-6 7.5 6 7.5 6-3 6-7.5 6-7.5-6-7.5-6z" stroke="currentColor" strokeWidth="1.4"/><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M2.5 2.5l13 13M7.4 7.5A2.5 2.5 0 0011.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M4 4.6C2.4 5.8 1.5 9 1.5 9s3 6 7.5 6c1.5 0 2.9-.4 4.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M6.5 3.3C7.3 3.1 8.1 3 9 3c4.5 0 7.5 6 7.5 6s-.7 1.4-2 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-[700] uppercase tracking-[0.05em]" style={{ color: C.charcoal }}>I am a...</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full rounded-xl px-3.5 py-3 outline-none text-[13px] text-[#1A1B2F] border-2 border-transparent focus:border-[#2B3990] focus:shadow-[0_0_0_3px_rgba(43,57,144,0.08)] transition-all cursor-pointer"
                    style={{ background: C.aliceLight }}
                  >
                    <option value="student">Student</option>
                    <option value="faculty_leadership">Faculty / Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {role === 'student' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-[700] uppercase tracking-[0.05em]" style={{ color: C.charcoal }}>Student ID Number</label>
                    <div className="flex items-center rounded-xl px-3.5 py-2.5 transition-all focus-within:shadow-[0_0_0_3px_rgba(43,57,144,0.08)] border-2 border-transparent focus-within:bg-white"
                         style={{ background: C.aliceLight }}>
                      <input type="text" required placeholder="e.g. USIU-2024-0417" value={studentIdNo} onChange={e => setStudentIdNo(e.target.value)}
                             className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1A1B2F] placeholder-[#9AABCC]" />
                    </div>
                  </div>
                )}

                {role === 'faculty_leadership' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-[700] uppercase tracking-[0.05em] truncate" style={{ color: C.charcoal }}>Title</label>
                      <select value={title} onChange={e => setTitle(e.target.value as FacultyTitle)} required
                              className="w-full rounded-xl px-3 py-2.5 outline-none text-[13px] text-[#1A1B2F] border-2 border-transparent focus:border-[#2B3990]" style={{ background: C.aliceLight }}>
                        <option value="">-- Select --</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="hod">HOD</option>
                        <option value="vc">VC</option>
                        <option value="staff">Staff</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-[700] uppercase tracking-[0.05em] truncate" style={{ color: C.charcoal }}>Department</label>
                      <input type="text" required placeholder="IT" value={department} onChange={e => setDepartment(e.target.value)}
                             className="w-full rounded-xl px-3 py-2.5 outline-none text-[13px] text-[#1A1B2F] border-2 border-transparent focus:border-[#2B3990] placeholder-[#9AABCC]" style={{ background: C.aliceLight }} />
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 text-white border-none rounded-xl p-3.5 text-[14px] font-[700] cursor-pointer shadow-[0_4px_14px_rgba(43,57,144,0.25)] flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${C.blue} 0%, #3d4fbe 100%)` }}
            >
              {loading ? 'Processing...' : (isLogin ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M7 3H3.5A1.5 1.5 0 002 4.5v9A1.5 1.5 0 003.5 15H7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M12 12l4-3-4-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 9H7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Login to Portal
                </>
              ) : 'Create Account')}
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
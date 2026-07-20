import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import type { RegisterPayload } from '../services/authService';
import type { UserRole, FacultyTitle } from '../api/types';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  
  // Conditional Fields
  const [studentIdNo, setStudentIdNo] = useState('');
  const [title, setTitle] = useState<FacultyTitle | ''>('');
  const [department, setDepartment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: RegisterPayload = {
        fullName,
        email,
        password,
        role,
        ...(role === 'student' && { studentIdNo }),
        ...(role === 'faculty_leadership' && { title: title || undefined, department })
      };

      await authService.register(payload);
      // After successful registration, redirect to the main app dashboard
      navigate('/shuttle'); 
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-twilight flex items-center justify-center p-4">
      <div className="bg-twilight-surface border border-twilight-border p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="h-12 w-12 mx-auto rounded-xl bg-gradient-to-br from-usiu-blue to-usiu-blue-dark flex items-center justify-center shadow-glow mb-4">
            <span className="font-display font-bold text-2xl text-alice leading-none">S</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-alice">Create Account</h1>
          <p className="text-sm text-alice-muted mt-2">Join SyncCampus USIU-Africa</p>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-alice">
          <div>
            <label className="block text-sm mb-1 text-alice-muted">Full Name</label>
            <input type="text" required className="w-full p-2.5 bg-twilight border border-twilight-border rounded-xl focus:outline-none focus:border-gold" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm mb-1 text-alice-muted">Email</label>
            <input type="email" required className="w-full p-2.5 bg-twilight border border-twilight-border rounded-xl focus:outline-none focus:border-gold" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm mb-1 text-alice-muted">Password</label>
            <input type="password" required className="w-full p-2.5 bg-twilight border border-twilight-border rounded-xl focus:outline-none focus:border-gold" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm mb-1 text-alice-muted">I am a...</label>
            <select className="w-full p-2.5 bg-twilight border border-twilight-border rounded-xl focus:outline-none focus:border-gold" value={role} onChange={e => setRole(e.target.value as UserRole)}>
              <option value="student">Student</option>
              <option value="faculty_leadership">Faculty / Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Dynamic Fields based on Role */}
          {role === 'student' && (
            <div>
              <label className="block text-sm mb-1 text-alice-muted">Student ID Number</label>
              <input type="text" required placeholder="e.g. USIU-2024-0417" className="w-full p-2.5 bg-twilight border border-twilight-border rounded-xl focus:outline-none focus:border-gold" value={studentIdNo} onChange={e => setStudentIdNo(e.target.value)} />
            </div>
          )}

          {role === 'faculty_leadership' && (
            <>
              <div>
                <label className="block text-sm mb-1 text-alice-muted">Title</label>
                <select className="w-full p-2.5 bg-twilight border border-twilight-border rounded-xl focus:outline-none focus:border-gold" value={title} onChange={e => setTitle(e.target.value as FacultyTitle)} required>
                  <option value="">-- Select Title --</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="hod">Head of Department (HOD)</option>
                  <option value="vc">Vice Chancellor</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-alice-muted">Department</label>
                <input type="text" required placeholder="e.g. Information Technology" className="w-full p-2.5 bg-twilight border border-twilight-border rounded-xl focus:outline-none focus:border-gold" value={department} onChange={e => setDepartment(e.target.value)} />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="w-full bg-usiu-blue hover:bg-usiu-blue-dark text-alice font-bold py-3 rounded-xl transition-colors mt-6">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-alice-muted mt-6">
          Already have an account? <Link to="/login" className="text-gold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
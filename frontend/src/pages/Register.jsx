import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('auth/register/', { username, email, password });
            // Auto login after register or redirect to login
            const res = await api.post('auth/login/', { username, password });
            localStorage.setItem('access_token', res.data.access);
            localStorage.setItem('refresh_token', res.data.refresh);
            navigate('/dashboard');
        } catch (error) {
            setError('Registration failed. Username might be taken.');
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, #1e293b 0%, #0f172a 100%)' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="flex-center" style={{ marginBottom: '2rem', flexDirection: 'column' }}>
                    <div style={{ background: 'var(--success)', padding: '12px', borderRadius: '12px', marginBottom: '1rem' }}>
                        <UserPlus size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Join the collaboration</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            className="input-field"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Email (Optional)</label>
                        <input
                            className="input-field"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            className="input-field"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        Sign Up <ArrowRight size={18} />
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ fontWeight: '600' }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;

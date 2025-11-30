import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Code2, ArrowRight } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('auth/login/', { username, password });
            localStorage.setItem('access_token', res.data.access);
            localStorage.setItem('refresh_token', res.data.refresh);
            navigate('/dashboard');
        } catch (error) {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="flex-center" style={{ marginBottom: '2rem', flexDirection: 'column' }}>
                    <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '12px', marginBottom: '1rem' }}>
                        <Code2 size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Sign in to continue coding</p>
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
                            placeholder="Enter your username"
                            required
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
                        Sign In <ArrowRight size={18} />
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ fontWeight: '600' }}>Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Users, Zap, Lock } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  const handleGetStarted = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="page-layout" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #1e293b 0%, #020617 60%)' }}>
      <header className="navbar" style={{ border: 'none', background: 'transparent' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" className="logo">
            <Code2 size={24} color="var(--primary)" />
            <span>CodeCollab</span>
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {token && (
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}
              >
                Go to Dashboard
              </button>
            )}
            <Link to="/login" style={{ fontSize: '0.9rem' }}>
              Log in
            </Link>
            <button
              className="btn-primary"
              onClick={handleGetStarted}
              style={{ width: 'auto', paddingInline: '1.25rem', fontSize: '0.9rem' }}
            >
              Get started free
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '3rem 1rem 4rem' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.5fr)',
            gap: '3rem',
            alignItems: 'center'
          }}
        >
          <div>
            <p
              style={{
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem'
              }}
            >
              Real-time code collaboration
            </p>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
              Pair-program in your browser with live code sync.
            </h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: '32rem', marginBottom: '1.5rem' }}>
              CodeCollab gives you a shared editor, project workspace, and version history so your team can build together without
              fighting merge conflicts.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                className="btn-primary"
                onClick={handleGetStarted}
                style={{ width: 'auto', paddingInline: '1.75rem' }}
              >
                Start a project
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  padding: '0.7rem 1.4rem',
                  fontSize: '0.9rem'
                }}
              >
                Already have an account?
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No downloads. Works with your browser and connects to our Django + Channels backend.
            </p>
          </div>

          <div>
            <div
              className="glass-card"
              style={{
                padding: '1.5rem',
                background: 'rgba(15,23,42,0.9)',
                borderRadius: '16px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '999px',
                      background: '#22c55e'
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>Live session</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>2 collaborators online</span>
              </div>
              <div
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: '0.8rem',
                  background: '#020617',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(148,163,184,0.4)',
                  minHeight: '9rem'
                }}
              >
                <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>// CodeCollab demo</div>
                <div style={{ color: '#e2e8f0' }}>function greet(name) &#123;</div>
                <div style={{ color: '#e2e8f0', paddingLeft: '1.5rem' }}>
                  console.log(`<span style={{ color: '#22c55e' }}>$&#123;name&#125;</span> joined the session`);
                </div>
                <div style={{ color: '#e2e8f0' }}>&#125;</div>
                <div style={{ marginTop: '0.75rem', color: '#a5b4fc' }}>greet('You');</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}
              >
                <span>Real-time sync powered by WebSockets + Redis</span>
                <span>Version history snapshots on every save</span>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: '3rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem'
            }}
          >
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} color="#facc15" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Live editing</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                See code changes appear instantly across all connected browsers with Django Channels and a shared file model.
              </p>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="#38bdf8" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Team-ready projects</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Organize work into projects and files with folder support, metadata, and per-file version history.
              </p>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} color="#22c55e" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Secure by design</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                JWT authentication on the API, environment-based settings, and Redis-backed channels for production-ready setups.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;



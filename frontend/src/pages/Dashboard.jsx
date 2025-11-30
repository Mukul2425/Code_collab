import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { FolderPlus, Code, LogOut } from 'lucide-react';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('projects/');
            setProjects(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const createProject = async () => {
        if (!newProjectName.trim()) return;
        try {
            await api.post('projects/', { name: newProjectName });
            setNewProjectName('');
            fetchProjects();
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    return (
        <div className="page-layout">
            <nav className="navbar" style={{ justifyContent: 'space-between' }}>
                <div className="logo">
                    <Code size={24} color="var(--primary)" />
                    <span>CodeCollab</span>
                </div>
                <button
                    onClick={handleLogout}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <LogOut size={18} /> Logout
                </button>
            </nav>

            <div className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Your Projects</h1>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="New Project Name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            style={{ width: '250px' }}
                        />
                        <button className="btn-primary" onClick={createProject} style={{ width: 'auto' }}>
                            <FolderPlus size={18} style={{ marginRight: '8px' }} />
                            Create
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {projects.map((project) => (
                        <Link to={`/editor/${project.id}`} key={project.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="glass-card" style={{ padding: '1.5rem', transition: 'transform 0.2s', cursor: 'pointer', height: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px' }}>
                                        <Code size={24} color="var(--primary)" />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{project.name}</h3>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    Created {new Date(project.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </Link>
                    ))}

                    {projects.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                            <FolderPlus size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>No projects yet. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

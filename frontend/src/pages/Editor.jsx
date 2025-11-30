import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../api';
import { FileCode, Plus, ChevronLeft, Save, Trash2 } from 'lucide-react';

const CodeEditor = () => {
    const { projectId } = useParams();
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [code, setCode] = useState('// Select a file to start editing');
    const [newFileName, setNewFileName] = useState('');
    const [socket, setSocket] = useState(null);
    const editorRef = useRef(null);
    const isRemoteUpdate = useRef(false);

    useEffect(() => {
        fetchFiles();
    }, [projectId]);

    useEffect(() => {
        if (selectedFile) {
            if (socket) {
                socket.close();
            }

            const newSocket = new WebSocket(`ws://localhost:8000/ws/file/${selectedFile.id}/`);

            newSocket.onopen = () => {
                console.log('✅ Connected to WebSocket (real-time sync enabled)');
            };

            newSocket.onerror = (error) => {
                console.warn('⚠️ WebSocket connection error. Real-time sync disabled. (Redis may not be running)');
                console.warn('You can still edit and save files normally.');
            };

            newSocket.onclose = () => {
                console.log('WebSocket disconnected');
            };

            newSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'file_update') {
                        isRemoteUpdate.current = true;
                        if (editorRef.current) {
                            const model = editorRef.current.getModel();
                            const currentPosition = editorRef.current.getPosition();
                            model.setValue(data.content);
                            editorRef.current.setPosition(currentPosition);
                        }
                        isRemoteUpdate.current = false;
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            setSocket(newSocket);

            return () => {
                if (newSocket.readyState === WebSocket.OPEN || newSocket.readyState === WebSocket.CONNECTING) {
                    newSocket.close();
                }
            };
        } else {
            // Close socket when no file is selected
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [selectedFile]);

    const fetchFiles = async () => {
        try {
            const res = await api.get(`files/?project=${projectId}`);
            setFiles(res.data.results || res.data); // Handle paginated or list response
        } catch (error) {
            console.error('Failed to fetch files:', error);
        }
    };

    const createFile = async () => {
        if (!newFileName.trim()) return;
        try {
            await api.post('files/', { 
                project: parseInt(projectId), 
                name: newFileName, 
                content: '',
                language: 'javascript'
            });
            setNewFileName('');
            fetchFiles();
        } catch (error) {
            console.error('Failed to create file:', error);
            const errorMsg = error.response?.data?.name?.[0] || error.response?.data?.error || 'Failed to create file';
            alert(errorMsg);
        }
    };

    const deleteFile = async (fileId, e) => {
        e.stopPropagation(); // Prevent file selection
        if (!confirm('Are you sure you want to delete this file?')) return;
        
        try {
            await api.delete(`files/${fileId}/`);
            if (selectedFile?.id === fileId) {
                setSelectedFile(null);
                setCode('// Select a file to start editing');
            }
            fetchFiles();
        } catch (error) {
            console.error('Failed to delete file:', error);
            alert('Failed to delete file');
        }
    };

    const handleFileClick = (file) => {
        setSelectedFile(file);
        setCode(file.content);
    };

    const handleEditorChange = (value) => {
        setCode(value);
        if (socket && socket.readyState === WebSocket.OPEN && !isRemoteUpdate.current) {
            socket.send(JSON.stringify({
                type: 'file_update',
                content: value
            }));
        }
    };

    const saveFile = async () => {
        if (!selectedFile) return;
        try {
            await api.patch(`files/${selectedFile.id}/`, {
                content: code
            });
            // Show success feedback
            const saveBtn = document.querySelector('.save-btn');
            if (saveBtn) {
                saveBtn.style.background = 'var(--success)';
                setTimeout(() => {
                    saveBtn.style.background = '';
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to save file:', error);
            alert('Failed to save file');
        }
    };

    // Auto-save on Ctrl+S
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveFile();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [code, selectedFile]);

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{ width: '280px', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        <ChevronLeft size={16} /> Back to Dashboard
                    </Link>
                    <h3 style={{ fontWeight: '600', color: 'var(--text-main)' }}>Project Files</h3>
                </div>

                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="New File.js"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            style={{ padding: '0.5rem' }}
                        />
                        <button className="btn-primary" onClick={createFile} style={{ width: 'auto', padding: '0.5rem' }}>
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                    {files.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FileCode size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p style={{ fontSize: '0.875rem' }}>No files yet. Create one to get started!</p>
                        </div>
                    ) : (
                        files.map((file) => (
                            <div
                                key={file.id}
                                onClick={() => handleFileClick(file)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: selectedFile?.id === file.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    color: selectedFile?.id === file.id ? 'var(--primary)' : 'var(--text-muted)',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = selectedFile?.id === file.id 
                                        ? 'rgba(59, 130, 246, 0.15)' 
                                        : 'rgba(255, 255, 255, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = selectedFile?.id === file.id 
                                        ? 'rgba(59, 130, 246, 0.1)' 
                                        : 'transparent';
                                }}
                            >
                                <FileCode size={18} />
                                <span style={{ fontSize: '0.9rem', flex: 1 }}>{file.name}</span>
                                <button
                                    onClick={(e) => deleteFile(file.id, e)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: 0.7
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#ef4444';
                                        e.currentTarget.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--text-muted)';
                                        e.currentTarget.style.opacity = '0.7';
                                    }}
                                    title="Delete file"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedFile ? (
                    <>
                        <div style={{ height: '48px', background: '#1e1e1e', display: 'flex', alignItems: 'center', padding: '0 1rem', borderBottom: '1px solid #333', gap: '1rem' }}>
                            <span style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: '500' }}>{selectedFile.name}</span>
                            <span style={{ color: '#666', fontSize: '0.75rem' }}>{selectedFile.language || 'plaintext'}</span>
                            <span style={{ color: '#666', fontSize: '0.75rem' }}>{selectedFile.line_count || 0} lines</span>
                            <span 
                                style={{ 
                                    marginLeft: 'auto', 
                                    fontSize: '0.8rem', 
                                    color: socket && socket.readyState === WebSocket.OPEN ? '#4ade80' : '#666', 
                                    marginRight: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                title={socket && socket.readyState === WebSocket.OPEN 
                                    ? 'Real-time sync enabled' 
                                    : 'Real-time sync disabled (Redis not running)'}
                            >
                                {socket && socket.readyState === WebSocket.OPEN ? '● Live' : '○ Offline'}
                            </span>
                            <button 
                                className="save-btn"
                                onClick={saveFile}
                                style={{ 
                                    background: 'var(--primary)', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '6px', 
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <Save size={16} />
                                Save
                            </button>
                        </div>
                        <Editor
                            height="calc(100vh - 48px)"
                            defaultLanguage={selectedFile?.language || 'javascript'}
                            language={selectedFile?.language || 'javascript'}
                            value={code}
                            onChange={handleEditorChange}
                            onMount={(editor) => (editorRef.current = editor)}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 20 },
                                wordWrap: 'on',
                                automaticLayout: true
                            }}
                        />
                    </>
                ) : (
                    <div className="flex-center" style={{ flex: 1, flexDirection: 'column', color: 'var(--text-muted)' }}>
                        <FileCode size={64} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                        <p>Select a file to start editing</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeEditor;

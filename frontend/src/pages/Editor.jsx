import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../api';
import { FileCode, Plus, ChevronLeft, Save, Trash2, Clock, FolderPlus } from 'lucide-react';

const CodeEditor = () => {
    const { projectId } = useParams();
    const [currentUser, setCurrentUser] = useState(null);
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [code, setCode] = useState('// Select a file to start editing');
    const [newFileName, setNewFileName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [versions, setVersions] = useState([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [socket, setSocket] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]); // presence list
    const [remoteCursors, setRemoteCursors] = useState({}); // username -> position
    const editorRef = useRef(null);
    const isRemoteUpdate = useRef(false);

    useEffect(() => {
        // Load current user once so we can identify presence/cursor updates
        const fetchMe = async () => {
            try {
                const res = await api.get('auth/me/');
                setCurrentUser(res.data);
            } catch (error) {
                console.error('Failed to fetch current user:', error);
            }
        };
        fetchMe();
    }, []);

    useEffect(() => {
        fetchFiles(selectedFolderId);
        fetchFolders();
    }, [projectId, selectedFolderId]);

    useEffect(() => {
        if (selectedFile) {
            if (socket) {
                socket.close();
            }

            const newSocket = new WebSocket(`ws://localhost:8000/ws/file/${selectedFile.id}/`);

            newSocket.onopen = () => {
                console.log('✅ Connected to WebSocket (real-time sync enabled)');
                // Announce presence when we know who we are
                if (currentUser?.username) {
                    newSocket.send(JSON.stringify({
                        type: 'presence_join',
                        username: currentUser.username,
                    }));
                }
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
                    } else if (data.type === 'presence') {
                        setActiveUsers((prev) => {
                            const alreadyPresent = prev.includes(data.username);
                            if (data.action === 'join' && !alreadyPresent) {
                                return [...prev, data.username];
                            }
                            if (data.action === 'leave') {
                                return prev.filter((u) => u !== data.username);
                            }
                            return prev;
                        });
                    } else if (data.type === 'cursor_update') {
                        setRemoteCursors((prev) => ({
                            ...prev,
                            [data.username]: data.position,
                        }));
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            setSocket(newSocket);

            // Load version history whenever a new file is selected
            fetchVersions(selectedFile.id);

            return () => {
                if (newSocket.readyState === WebSocket.OPEN || newSocket.readyState === WebSocket.CONNECTING) {
                    if (currentUser?.username) {
                        newSocket.send(JSON.stringify({
                            type: 'presence_leave',
                            username: currentUser.username,
                        }));
                    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFile, currentUser]);

    const fetchFiles = async (folderId = null) => {
        try {
            const folderParam = folderId ? `&folder=${folderId}` : '';
            const res = await api.get(`files/?project=${projectId}${folderParam}`);
            setFiles(res.data.results || res.data); // Handle paginated or list response
        } catch (error) {
            console.error('Failed to fetch files:', error);
        }
    };

    const fetchFolders = async () => {
        try {
            const res = await api.get(`files/folders/?project=${projectId}`);
            setFolders(res.data.results || res.data || []);
        } catch (error) {
            console.error('Failed to fetch folders:', error);
        }
    };

    const fetchVersions = async (fileId) => {
        if (!fileId) return;
        setLoadingVersions(true);
        try {
            const res = await api.get(`versions/?file_id=${fileId}`);
            setVersions(res.data.results || res.data || []);
        } catch (error) {
            console.error('Failed to fetch versions:', error);
        } finally {
            setLoadingVersions(false);
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

    const createFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await api.post('files/folders/', {
                name: newFolderName,
                project: parseInt(projectId),
                parent: null,
            });
            setNewFolderName('');
            fetchFolders();
        } catch (error) {
            console.error('Failed to create folder:', error);
            alert('Failed to create folder');
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
        fetchVersions(file.id);
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

            // Refresh versions after a successful save so the new snapshot appears
            fetchVersions(selectedFile.id);
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

    // Listen for cursor position changes and broadcast them
    const handleEditorMount = (editor) => {
        editorRef.current = editor;
        editor.onDidChangeCursorPosition((e) => {
            if (socket && socket.readyState === WebSocket.OPEN && currentUser?.username) {
                const position = {
                    lineNumber: e.position.lineNumber,
                    column: e.position.column,
                };
                socket.send(JSON.stringify({
                    type: 'cursor_update',
                    username: currentUser.username,
                    position,
                }));
            }
        });
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
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-dark)' }}>
            {/* Sidebar */}
            <div style={{ width: '280px', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        <ChevronLeft size={16} /> Back to Dashboard
                    </Link>
                    <h3 style={{ fontWeight: '600', color: 'var(--text-main)' }}>Project Files</h3>
                </div>

                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Folders</span>
                        <button
                            onClick={() => setSelectedFolderId(null)}
                            style={{
                                borderRadius: '999px',
                                border: 'none',
                                padding: '0.2rem 0.6rem',
                                fontSize: '0.75rem',
                                background: selectedFolderId === null ? 'rgba(59,130,246,0.2)' : 'transparent',
                                color: selectedFolderId === null ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            All files
                        </button>
                    </div>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '0.75rem' }}>
                        {folders.map((folder) => (
                            <div
                                key={folder.id}
                                onClick={() => setSelectedFolderId(folder.id)}
                                style={{
                                    padding: '0.3rem 0.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    color: selectedFolderId === folder.id ? 'var(--primary)' : 'var(--text-muted)',
                                    background: selectedFolderId === folder.id ? 'rgba(59,130,246,0.15)' : 'transparent'
                                }}
                            >
                                {folder.name}
                            </div>
                        ))}
                        {folders.length === 0 && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No folders yet.</p>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '0.25rem' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="New folder"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                        />
                        <button
                            className="btn-primary"
                            onClick={createFolder}
                            style={{ width: 'auto', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Create folder"
                        >
                            <FolderPlus size={16} />
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
                            <div style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {activeUsers.map((username) => {
                                    const cursor = remoteCursors[username];
                                    return (
                                        <div
                                            key={username}
                                            style={{
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '999px',
                                                background: 'rgba(15,23,42,0.8)',
                                                border: '1px solid rgba(148,163,184,0.4)',
                                                fontSize: '0.75rem',
                                                color: '#e5e7eb',
                                            }}
                                            title={cursor ? `Line ${cursor.lineNumber}, Col ${cursor.column}` : 'Viewing file'}
                                        >
                                            {username}
                                            {cursor && ` · L${cursor.lineNumber}`}
                                        </div>
                                    );
                                })}
                            </div>
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
                        <div style={{ display: 'flex', height: 'calc(100vh - 48px)' }}>
                            <div style={{ flex: 1 }}>
                                <Editor
                                    height="100%"
                                    defaultLanguage={selectedFile?.language || 'javascript'}
                                    language={selectedFile?.language || 'javascript'}
                                    value={code}
                                    onChange={handleEditorChange}
                                    onMount={handleEditorMount}
                                    theme="vs-dark"
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        padding: { top: 20 },
                                        wordWrap: 'on',
                                        automaticLayout: true
                                    }}
                                />
                            </div>

                            {/* Version history sidebar */}
                            <div style={{ width: '260px', borderLeft: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Version History</span>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
                                    {loadingVersions ? (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading versions...</p>
                                    ) : versions.length === 0 ? (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No versions yet. Save the file to create snapshots.</p>
                                    ) : (
                                        versions.map((version) => (
                                            <div
                                                key={version.id}
                                                style={{
                                                    padding: '0.5rem 0.6rem',
                                                    borderRadius: '6px',
                                                    marginBottom: '0.4rem',
                                                    background: 'rgba(15, 23, 42, 0.6)',
                                                    border: '1px solid rgba(148, 163, 184, 0.3)'
                                                }}
                                            >
                                                <div style={{ fontSize: '0.8rem', color: '#e5e7eb' }}>
                                                    {new Date(version.created_at).toLocaleTimeString()}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                    {version.created_by_username || 'Unknown user'}
                                                </div>
                                                {version.description && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                        {version.description}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Revert to this version? A new snapshot of the current content will be created first.')) return;
                                                        try {
                                                            await api.post(`versions/${version.id}/revert/`);
                                                            // Refresh file content and versions
                                                            const res = await api.get(`files/${selectedFile.id}/`);
                                                            setSelectedFile(res.data);
                                                            setCode(res.data.content);
                                                            fetchVersions(selectedFile.id);
                                                        } catch (error) {
                                                            console.error('Failed to revert version:', error);
                                                            alert('Failed to revert version');
                                                        }
                                                    }}
                                                    style={{
                                                        marginTop: '0.25rem',
                                                        width: '100%',
                                                        padding: '0.3rem 0.5rem',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '4px',
                                                        border: 'none',
                                                        background: 'rgba(59, 130, 246, 0.15)',
                                                        color: 'var(--primary)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Revert
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
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

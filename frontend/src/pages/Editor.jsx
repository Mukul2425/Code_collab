import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../api';
import { FileCode, Plus, ChevronLeft, Save } from 'lucide-react';

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
                console.log('Connected to WebSocket');
            };

            newSocket.onmessage = (event) => {
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
            };

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [selectedFile]);

    const fetchFiles = async () => {
        try {
            const res = await api.get('files/');
            const projectFiles = res.data.filter(f => f.project == projectId);
            setFiles(projectFiles);
        } catch (error) {
            console.error(error);
        }
    };

    const createFile = async () => {
        if (!newFileName.trim()) return;
        try {
            await api.post('files/', { project: projectId, name: newFileName, content: '' });
            setNewFileName('');
            fetchFiles();
        } catch (error) {
            console.error(error);
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
                    {files.map((file) => (
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
                                transition: 'all 0.2s'
                            }}
                        >
                            <FileCode size={18} />
                            <span style={{ fontSize: '0.9rem' }}>{file.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedFile ? (
                    <>
                        <div style={{ height: '48px', background: '#1e1e1e', display: 'flex', alignItems: 'center', padding: '0 1rem', borderBottom: '1px solid #333' }}>
                            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>{selectedFile.name}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#666' }}>
                                {socket && socket.readyState === WebSocket.OPEN ? '● Live' : '○ Disconnected'}
                            </span>
                        </div>
                        <Editor
                            height="calc(100vh - 48px)"
                            defaultLanguage="javascript"
                            value={code}
                            onChange={handleEditorChange}
                            onMount={(editor) => (editorRef.current = editor)}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 20 }
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

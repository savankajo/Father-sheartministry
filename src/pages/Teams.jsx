import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, Plus, Users, Hash } from 'lucide-react';

const Teams = () => {
    const { currentUser, isAdmin } = useAuth();
    const [activeTeam, setActiveTeam] = useState(null);
    const [messageInput, setMessageInput] = useState('');

    // Mock Teams
    const [teams, setTeams] = useState([
        { id: 't1', name: 'Worship Team', members: [] },
        { id: 't2', name: 'Media Team', members: [] },
        { id: 't3', name: 'Greeting Team', members: [] }
    ]);

    // Mock Messages
    // In real app, this would be a Firestore listener based on activeTeam.id
    const [messages, setMessages] = useState({
        't1': [
            { id: 1, sender: 'Worship Leader', text: 'Practice is at 7pm!', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: 2, sender: 'Drummer', text: 'I will be there.', timestamp: new Date(Date.now() - 1800000).toISOString() }
        ],
        't2': [
            { id: 1, sender: 'Admin', text: 'Who is running slides on Sunday?', timestamp: new Date(Date.now() - 90000000).toISOString() }
        ],
        't3': []
    });

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeTeam]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeTeam) return;

        const newMessage = {
            id: Date.now(),
            sender: currentUser.displayName || currentUser.email,
            text: messageInput,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => ({
            ...prev,
            [activeTeam.id]: [...(prev[activeTeam.id] || []), newMessage]
        }));

        setMessageInput('');
    };

    const handleCreateTeam = () => {
        const name = prompt("Enter new team name:");
        if (name) {
            const newTeam = { id: `t${Date.now()}`, name, members: [] };
            setTeams([...teams, newTeam]);
        }
    };

    return (
        <div className="animate-fade-in chat-layout">
            {/* Sidebar */}
            <div className="teams-sidebar card">
                <div className="sidebar-header">
                    <h2>Teams</h2>
                    {isAdmin && (
                        <button className="btn-icon-sm" onClick={handleCreateTeam} title="Create Team">
                            <Plus size={20} />
                        </button>
                    )}
                </div>

                <div className="teams-list">
                    {teams.map(team => (
                        <div
                            key={team.id}
                            className={`team-item ${activeTeam?.id === team.id ? 'active' : ''}`}
                            onClick={() => setActiveTeam(team)}
                        >
                            <Hash size={18} />
                            <span>{team.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-area card">
                {activeTeam ? (
                    <>
                        <div className="chat-header">
                            <h3>{activeTeam.name}</h3>
                            <span className="member-count"><Users size={16} /> {activeTeam.members.length} members</span>
                        </div>

                        <div className="messages-container">
                            {(messages[activeTeam.id] || []).map(msg => {
                                const isMe = msg.sender === (currentUser.displayName || currentUser.email);
                                return (
                                    <div key={msg.id} className={`message-wrapper ${isMe ? 'mine' : 'theirs'}`}>
                                        {!isMe && <span className="message-sender">{msg.sender}</span>}
                                        <div className="message-bubble">
                                            {msg.text}
                                        </div>
                                        <span className="message-time">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })}
                            {(!messages[activeTeam.id] || messages[activeTeam.id].length === 0) && (
                                <div className="empty-chat">
                                    <MessageSquare size={48} color="#e5e7eb" />
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <input
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder={`Message #${activeTeam.name}...`}
                            />
                            <button type="submit" className="btn btn-primary" disabled={!messageInput.trim()}>
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-team-selected">
                        <MessageSquare size={64} color="var(--color-primary)" />
                        <h2>Select a Team</h2>
                        <p>Choose a team from the sidebar to view chat</p>
                    </div>
                )}
            </div>

            <style>{`
        .chat-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.5rem;
          height: calc(100vh - 140px); /* Adjust for navbar and padding */
        }
        
        @media (max-width: 768px) {
          .chat-layout {
            grid-template-columns: 1fr;
          }
          .teams-sidebar {
            display: ${activeTeam ? 'none' : 'block'};
          }
          .chat-area {
            display: ${activeTeam ? 'flex' : 'none'};
            height: 80vh;
          }
        }

        .teams-sidebar {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          padding: 0;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-icon-sm {
          padding: 0.25rem;
          border-radius: 4px;
          color: var(--text-muted);
        }
        .btn-icon-sm:hover { background: #f3f4f6; color: var(--color-primary); }

        .teams-list {
          padding: 1rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .team-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          color: var(--text-muted);
          font-weight: 500;
          transition: all 0.2s;
        }

        .team-item:hover {
          background: #f9fafb;
          color: var(--text-main);
        }

        .team-item.active {
          background: #fff0f0;
          color: var(--color-primary);
        }

        .chat-area {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0;
          overflow: hidden;
        }

        .chat-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
        }

        .member-count {
          color: var(--text-muted);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          background: #fdfdfd;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-wrapper {
          display: flex;
          flex-direction: column;
          max-width: 70%;
        }

        .message-wrapper.mine {
          align-self: flex-end;
          align-items: flex-end;
        }

        .message-wrapper.theirs {
          align-self: flex-start;
          align-items: flex-start;
        }

        .message-sender {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
          margin-left: 0.5rem;
        }

        .message-bubble {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          position: relative;
          line-height: 1.4;
        }

        .mine .message-bubble {
          background: var(--color-primary);
          color: white;
          border-bottom-right-radius: 2px;
        }

        .theirs .message-bubble {
          background: #f3f4f6;
          color: var(--text-main);
          border-bottom-left-radius: 2px;
        }

        .message-time {
          font-size: 0.7rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        .chat-input-area {
          padding: 1rem;
          background: #fff;
          border-top: 1px solid #f3f4f6;
          display: flex;
          gap: 0.75rem;
        }

        .chat-input-area input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 99px;
          outline: none;
        }

        .chat-input-area input:focus {
          border-color: var(--color-primary);
        }

        .no-team-selected, .empty-chat {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: var(--text-muted);
          gap: 1rem;
        }
      `}</style>
        </div>
    );
};

export default Teams;

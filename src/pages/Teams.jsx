import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, writeBatch, doc } from 'firebase/firestore';
import { MessageSquare, Send, Plus, Users, Hash } from 'lucide-react';

const Teams = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTeam, setActiveTeam] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [teams, setTeams] = useState([]);
  const [userTeams, setUserTeams] = useState([]);

  const messagesEndRef = useRef(null);

  // Auth Guard
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // 1. Fetch My Teams (from user profile) so we know what I can see
  useEffect(() => {
    // Safety check mostly for development, though caught by Auth Guard above
    if (!currentUser) return;

    const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
      if (doc.exists()) {
        const myTeams = doc.data().teams || [];
        setUserTeams(myTeams);

        // Construct team objects based on strings
        // In a real app, you might have a strict 'teams' collection
        const teamObjects = myTeams.map(t => ({
          id: t,
          name: t,
          members: [] // We don't need full member list for chat view
        }));

        setTeams(teamObjects);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 2. Auto-Cleanup Old Messages (> 48h)
  useEffect(() => {
    const cleanupOldMessages = async () => {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const q = query(
        collection(db, "messages"),
        where("timestamp", "<", fortyEightHoursAgo)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${snapshot.size} old messages.`);
      }
    };

    cleanupOldMessages();
  }, []);

  // 3. Fetch Messages for Active Team
  useEffect(() => {
    if (!activeTeam) return;

    const q = query(
      collection(db, "messages"),
      where("teamId", "==", activeTeam.id),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeTeam]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeTeam) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: messageInput,
        sender: currentUser.displayName || currentUser.email,
        senderId: currentUser.uid,
        teamId: activeTeam.id,
        timestamp: new Date().toISOString()
      });
      setMessageInput('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="teams-layout animate-fade-in">
      {/* Sidebar */}
      <div className="teams-sidebar">
        <div className="sidebar-header">
          <h2>Teams</h2>
          {/* Admin could add teams here, but handled in Admin panel for now */}
        </div>

        <div className="team-list">
          {teams.length === 0 ? (
            <div className="empty-teams">
              <p>You haven't been added to any teams yet.</p>
            </div>
          ) : (
            teams.map(team => (
              <div
                key={team.id}
                className={`team-item ${activeTeam?.id === team.id ? 'active' : ''}`}
                onClick={() => setActiveTeam(team)}
              >
                <Hash size={18} />
                <span>{team.name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {activeTeam ? (
          <>
            <div className="chat-header">
              <div className="header-info">
                <Hash size={20} />
                <h3>{activeTeam.name}</h3>
              </div>
              <span className="badge-warning">Messages expire in 48h</span>
            </div>

            <div className="messages-list">
              {messages.map(msg => {
                const isMe = msg.senderId === currentUser.uid;
                return (
                  <div key={msg.id} className={`message-row ${isMe ? 'message-own' : ''}`}>
                    <div className="message-bubble">
                      {!isMe && <div className="message-sender">{msg.sender}</div>}
                      <div className="message-text">{msg.text}</div>
                      <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input-area" onSubmit={handleSendMessage}>
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message #${activeTeam.name}`}
              />
              <button type="submit" disabled={!messageInput.trim()}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="no-team-selected">
            <MessageSquare size={48} color="#cbd5e1" />
            <p>Select a team to start chatting</p>
          </div>
        )}
      </div>

      <style>{`
        .teams-layout {
          display: flex;
          height: calc(100vh - 100px); /* Adjust based on navbar */
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-top: 1rem;
        }

        .teams-sidebar {
          width: 260px;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          background: #f9fafb;
        }

        .sidebar-header {
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .team-list {
            padding: 1rem;
            flex: 1;
            overflow-y: auto;
        }

        .team-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            color: #4b5563;
            transition: all 0.2s;
            margin-bottom: 0.25rem;
        }
        .team-item:hover {
            background: #e5e7eb;
        }
        .team-item.active {
            background: var(--color-primary-light);
            color: var(--color-primary);
            font-weight: 500;
        }

        .empty-teams {
            text-align: center;
            padding: 2rem 1rem;
            color: #6b7280;
            font-size: 0.9rem;
        }

        .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .chat-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
        }

        .header-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .badge-warning {
            background: #fef3c7;
            color: #d97706;
            font-size: 0.75rem;
            padding: 2px 8px;
            border-radius: 9999px;
            font-weight: 500;
        }

        .messages-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            background: #ffffff;
        }

        .message-row {
            display: flex;
        }
        .message-own {
            justify-content: flex-end;
        }

        .message-bubble {
            max-width: 70%;
            padding: 0.75rem 1rem;
            border-radius: 12px;
            background: #f3f4f6;
            position: relative;
        }
        .message-own .message-bubble {
            background: var(--color-primary);
            color: white;
            border-bottom-right-radius: 4px;
        }
        .message-row:not(.message-own) .message-bubble {
            border-bottom-left-radius: 4px;
        }

        .message-sender {
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
            color: var(--color-primary);
        }

        .message-time {
            font-size: 0.65rem;
            text-align: right;
            margin-top: 0.25rem;
            opacity: 0.7;
        }

        .message-input-area {
            padding: 1rem;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 0.5rem;
            background: #f9fafb;
        }

        .message-input-area input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            outline: none;
        }
        .message-input-area input:focus {
            border-color: var(--color-primary);
        }

        .message-input-area button {
            background: var(--color-primary);
            color: white;
            border: none;
            width: 44px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
        }
        .message-input-area button:disabled {
            background: #d1d5db;
        }
        .message-input-area button:hover:not(:disabled) {
            opacity: 0.9;
        }

        .no-team-selected {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            gap: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Teams;

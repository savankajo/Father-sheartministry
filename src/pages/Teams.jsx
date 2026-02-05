import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import { MessageSquare, Send, Plus, Users, Hash } from 'lucide-react';

const Teams = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTeam, setActiveTeam] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [teams, setTeams] = useState([]);
  const [userTeams, setUserTeams] = useState([]);

  const messagesEndRef = useRef(null);

  // 1. Fetch My Teams (from user profile) so we know what I can see
  useEffect(() => {
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
  }, [currentUser.uid]);

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
    <div className="animate-fade-in chat-layout">
      {/* Sidebar */}
      <div className="teams-sidebar card">
        <div className="sidebar-header">
          <h2>My Teams</h2>
          {isAdmin && (
            <button className="btn-icon-sm" title="Manage Teams in Admin Dashboard">
              <Plus size={20} />
            </button>
          )}
        </div>

        <div className="teams-list">
          {teams.length === 0 ? (
            <p className="no-teams-msg">You are not in any teams yet.</p>
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
      <div className="chat-area card">
        {activeTeam ? (
          <>
            <div className="chat-header">
              <h3>{activeTeam.name}</h3>
              <span className="member-count">Messages expire in 48h</span>
            </div>

            <div className="messages-container">
              {messages.map(msg => {
                const isMe = msg.senderId === currentUser.uid;
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
              {messages.length === 0 && (
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
            {teams.length > 0 ? (
              <p>Choose a team from the sidebar to view chat</p>
            ) : (
              <p>Ask an admin to add you to a team first.</p>
            )}
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

        .no-teams-msg {
            padding: 1rem;
            color: var(--text-muted);
            font-size: 0.9rem;
            font-style: italic;
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
          color: #ef4444;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #fee2e2;
          padding: 2px 6px;
          border-radius: 4px;
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

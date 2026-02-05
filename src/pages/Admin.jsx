import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { Trash2, ShieldAlert, Shield, Plus, X } from 'lucide-react';

const Admin = () => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Team Management State
    const [teams, setTeams] = useState([]);
    const [newTeamName, setNewTeamName] = useState('');

    useEffect(() => {
        if (!isAdmin) return;

        // Subscribe to Users
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
            setLoading(false);
        });

        // Subscribe to Teams
        const unsubTeams = onSnapshot(collection(db, "teams"), (snapshot) => {
            const teamsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // If empty, we could seed defaults, but let's just let user create them
            // Fallback for first run if no teams exist in DB yet
            if (teamsList.length === 0) {
                // Optional: Set default teams locally if DB is empty to prevent UI from being blank
                // But for "Create/Remove" feature, we want real DB sync.
            }
            setTeams(teamsList);
        });

        return () => {
            unsubUsers();
            unsubTeams();
        };
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div className="access-denied">
                <ShieldAlert size={64} className="icon-error" />
                <h1>Access Denied</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    // --- User Actions ---
    const handleRemoveUser = async (uid) => {
        if (confirm("Are you sure you want to remove this user? This cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "users", uid));
            } catch (error) {
                console.error("Error removing user: ", error);
                alert("Failed to remove user");
            }
        }
    };

    const handleAddTeamToUser = async (uid, teamName) => {
        if (!teamName) return;
        try {
            await updateDoc(doc(db, "users", uid), {
                teams: arrayUnion(teamName)
            });
        } catch (error) {
            console.error("Error adding team to user", error);
        }
    };

    const handleRemoveTeamFromUser = async (uid, teamName) => {
        try {
            await updateDoc(doc(db, "users", uid), {
                teams: arrayRemove(teamName)
            });
        } catch (error) {
            console.error("Error removing team from user", error);
        }
    };

    // --- Team Management Actions ---
    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;

        try {
            // Use name as ID for simplicity in this app to match existing string-based logic
            // In a larger app, use auto-ID and store name as field.
            // But 'Teams.jsx' expects strings in user.teams array.
            const teamId = newTeamName.trim();

            // Check if exists (by checking if it's in the list)
            if (teams.some(t => t.id === teamId)) {
                alert("Team already exists!");
                return;
            }

            await setDoc(doc(db, "teams", teamId), {
                name: newTeamName.trim(),
                createdAt: new Date().toISOString()
            });
            setNewTeamName('');
        } catch (error) {
            console.error("Error creating team:", error);
            alert("Failed to create team.");
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (confirm(`Delete "${teamId}" team? This will remove it from the list, but users may still have it in their profile until updated.`)) {
            try {
                await deleteDoc(doc(db, "teams", teamId));
            } catch (error) {
                console.error("Error deleting team:", error);
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="header-flex">
                <Shield size={32} className="text-primary" />
                <h1>Admin Dashboard</h1>
            </div>

            <div className="dashboard-grid">
                {/* Section 1: Manage Teams */}
                <div className="card">
                    <h3>Ministry Teams</h3>
                    <p className="subtitle">Create and manage available teams.</p>

                    <form onSubmit={handleCreateTeam} className="add-team-form">
                        <input
                            value={newTeamName}
                            onChange={e => setNewTeamName(e.target.value)}
                            placeholder="New Team Name (e.g. 'Security')"
                            className="input-sm"
                        />
                        <button type="submit" className="btn btn-sm btn-primary">
                            <Plus size={16} /> Add
                        </button>
                    </form>

                    <div className="teams-list-chips">
                        {teams.length === 0 && <span className="text-muted text-sm">No teams created yet.</span>}
                        {teams.map(team => (
                            <div key={team.id} className="team-chip">
                                <span>{team.name}</span>
                                <button onClick={() => handleDeleteTeam(team.id)} className="btn-icon-danger-sm">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 2: Manage Users */}
                <div className="card full-width-card">
                    <h3>User Management</h3>
                    <p className="subtitle">Assign members to teams.</p>

                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Teams</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.uid}>
                                        <td><strong>{user.displayName}</strong></td>
                                        <td>{user.email}</td>
                                        <td>
                                            <div className="teams-cell">
                                                <div className="tags">
                                                    {(user.teams || []).map(team => (
                                                        <span key={team} className="tag">
                                                            {team}
                                                            <button
                                                                className="remove-tag-btn"
                                                                onClick={() => handleRemoveTeamFromUser(user.uid, team)}
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                                <select
                                                    className="team-select"
                                                    onChange={(e) => {
                                                        handleAddTeamToUser(user.uid, e.target.value);
                                                        e.target.value = ""; // Reset
                                                    }}
                                                >
                                                    <option value="">+ Add Team</option>
                                                    {teams.map(t => (
                                                        <option
                                                            key={t.id}
                                                            value={t.name}
                                                            disabled={(user.teams || []).includes(t.name)}
                                                        >
                                                            {t.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td>
                                            {user.email !== 'media@fathersheartministry.ca' && (
                                                <button className="btn-icon-danger" onClick={() => handleRemoveUser(user.uid)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style>{`
        .access-denied {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          color: #dc2626;
        }

        .dashboard-grid {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .icon-error { margin-bottom: 1rem; }
        .text-primary { color: var(--color-primary); }
        .text-sm { font-size: 0.85rem; }

        .subtitle {
          color: var(--text-muted);
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          text-align: left;
          padding: 1rem;
          background: #f9fafb;
          font-weight: 600;
          color: var(--text-muted);
        }

        .admin-table td {
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
        }

        .teams-cell {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .tag {
          background: #f3f4f6;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-size: 0.85rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .remove-tag-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2px;
            border-radius: 50%;
            cursor: pointer;
            color: #991b1b;
        }
        .remove-tag-btn:hover {
            background: #fee2e2;
        }

        .team-select {
            padding: 0.25rem;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
            font-size: 0.85rem;
            max-width: 150px;
        }

        .btn-icon-danger {
          color: #dc2626;
          padding: 0.5rem;
          border-radius: 4px;
        }
        .btn-icon-danger:hover {
          background: #fee2e2;
        }

        /* New Styles for Team Management */
        .add-team-form {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .input-sm {
            padding: 0.4rem 0.8rem;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 0.9rem;
            flex: 1;
            max-width: 250px;
        }

        .btn-sm {
            padding: 0.4rem 0.8rem;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .teams-list-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }

        .team-chip {
            background: white;
            border: 1px solid #e5e7eb;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
            font-size: 0.9rem;
        }

        .btn-icon-danger-sm {
            color: #991b1b;
            background: transparent;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
        }
        .btn-icon-danger-sm:hover {
            color: #ef4444;
        }
      `}</style>
        </div>
    );
};

export default Admin;

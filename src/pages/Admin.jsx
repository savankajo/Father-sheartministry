import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Trash2, UserPlus, ShieldAlert, Shield } from 'lucide-react';

const Admin = () => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) return;

        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
            setLoading(false);
        });

        return () => unsubscribe();
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

    return (
        <div className="animate-fade-in">
            <div className="header-flex">
                <Shield size={32} className="text-primary" />
                <h1>Admin Dashboard</h1>
            </div>

            <div className="card">
                <h3>User Management</h3>
                <p className="subtitle">Manage church members and their team assignments.</p>

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
                                        <div className="tags">
                                            {user.teams.map(team => (
                                                <span key={team} className="tag">{team}</span>
                                            ))}
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

            <style>{`
        .access-denied {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          color: #dc2626;
        }

        .icon-error { margin-bottom: 1rem; }
        .text-primary { color: var(--color-primary); }

        .subtitle {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
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
        }

        .btn-icon-danger {
          color: #dc2626;
          padding: 0.5rem;
          border-radius: 4px;
        }
        .btn-icon-danger:hover {
          background: #fee2e2;
        }
      `}</style>
        </div>
    );
};

export default Admin;

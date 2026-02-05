import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfWeek, addDays } from 'date-fns';
import { CheckCircle, Circle, UserPlus, Lock } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';

const Roster = () => {
    const { currentUser } = useAuth();
    // Default to upcoming Sunday
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const nextSunday = new Date(today.setDate(today.getDate() + (7 - today.getDay()) % 7));
        return nextSunday;
    });

    const [services, setServices] = useState([]);
    const [userMap, setUserMap] = useState({});
    const [currentUserTeams, setCurrentUserTeams] = useState([]);

    // Role to Team Mapping
    const ROLE_RESTRICTIONS = {
        'Worship Leader': 'Worship Team',
        'Keys': 'Worship Team',
        'Drums': 'Worship Team',
        'Guitar': 'Worship Team',
        'Vocals': 'Worship Team',
        'Sound': 'Media Team',
        'Media/ProPresenter': 'Media Team',
        'Livestream': 'Media Team',
        'Greeter': 'Greeting Team',
        'Usher': 'Ushering',
        'Kids Teacher': 'Kids Ministry'
    };

    // Fetch Content
    useEffect(() => {
        // 1. Fetch User Profiles for Name Lookup and Current User Teams
        const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const map = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                map[doc.id] = data.displayName || data.email;

                // Update current user teams
                if (doc.id === currentUser.uid) {
                    setCurrentUserTeams(data.teams || []);
                }
            });
            setUserMap(map);
        });

        // 2. Fetch Services
        const unsubscribeServices = onSnapshot(collection(db, "services"), (snapshot) => {
            let fetchedServices = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // If no service exists for selected date, create a placeholder one locally
            // In a real production app, an Admin would "Create Service" explicitly
            if (fetchedServices.length === 0) {
                // Auto-create a doc for "Next Sunday" if it doesn't exist
                // For now, we just show emptiness or a "Create" button, 
                // but for this MVP we'll auto-generate a default structure if DB is empty
            }

            // Sort by date
            fetchedServices.sort((a, b) => new Date(a.date) - new Date(b.date));
            setServices(fetchedServices);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeServices();
        };
    }, [currentUser.uid]);

    // Helper to generate a default service doc if none exists (for demo purposes)
    const MAX_DEMO_SERVICES = 1;
    useEffect(() => {
        if (services.length < MAX_DEMO_SERVICES) {
            // Check if we already tried to create one to avoid loop
            const setupDefaultService = async () => {
                const snapshot = await getDocs(collection(db, "services"));
                if (snapshot.empty) {
                    const nextSunday = new Date();
                    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);
                    nextSunday.setHours(10, 0, 0, 0);

                    const newService = {
                        date: nextSunday.toISOString(),
                        type: 'Sunday Service',
                        roles: {
                            'Worship Leader': null,
                            'Keys': null,
                            'Drums': null,
                            'Media/ProPresenter': null,
                            'Sound': null,
                            'Greeter': null
                        }
                    };
                    await setDoc(doc(collection(db, "services")), newService);
                }
            };
            setupDefaultService();
        }
    }, [services.length]);


    const handleVolunteer = async (serviceId, role) => {
        const requiredTeam = ROLE_RESTRICTIONS[role];

        // Restriction Check
        if (requiredTeam && !currentUserTeams.includes(requiredTeam)) {
            alert(`You must be a member of the "${requiredTeam}" to volunteer for this role.`);
            return;
        }

        if (confirm(`Volunteer for ${role}?`)) {
            try {
                const serviceRef = doc(db, "services", serviceId);
                // We use dot notation to update nested field
                await updateDoc(serviceRef, {
                    [`roles.${role}`]: currentUser.uid
                });
            } catch (error) {
                console.error("Error signing up:", error);
                alert("Failed to sign up.");
            }
        }
    };

    const handleCancel = async (serviceId, role) => {
        if (confirm(`Remove yourself from ${role}?`)) {
            try {
                const serviceRef = doc(db, "services", serviceId);
                await updateDoc(serviceRef, {
                    [`roles.${role}`]: null
                });
            } catch (error) {
                console.error("Error cancelling:", error);
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="header-flex">
                <h1>Service Roster</h1>
                <span className="current-date-display sub-text">
                    Next Service: {format(selectedDate, 'MMMM d, yyyy')}
                </span>
            </div>

            <div className="roster-grid">
                {services.map(service => (
                    <div key={service.id} className="card roster-card">
                        <div className="card-header">
                            <h2>{service.type}</h2>
                            <span className="badge">{format(new Date(service.date), 'eeee, h:mm a')}</span>
                        </div>

                        <div className="roles-list">
                            {Object.entries(service.roles).map(([role, assigneeId]) => {
                                const requiredTeam = ROLE_RESTRICTIONS[role];
                                const canVolunteer = !requiredTeam || currentUserTeams.includes(requiredTeam);
                                const isAssignedToMe = assigneeId === currentUser.uid;

                                return (
                                    <div key={role} className="role-item">
                                        <div className="role-info">
                                            <span className="role-title">
                                                {role}
                                                {requiredTeam && <span className="team-badge">{requiredTeam}</span>}
                                            </span>

                                            {assigneeId ? (
                                                <span className={`assignee ${isAssignedToMe ? 'filled-me' : 'filled'}`}>
                                                    <CheckCircle size={16} />
                                                    {userMap[assigneeId] || 'Unknown User'}
                                                </span>
                                            ) : (
                                                <span className="assignee empty">
                                                    <Circle size={16} /> Open
                                                </span>
                                            )}
                                        </div>

                                        {!assigneeId && (
                                            <button
                                                className={`btn-sm ${canVolunteer ? 'btn-outline' : 'btn-disabled'}`}
                                                onClick={() => handleVolunteer(service.id, role)}
                                                disabled={!canVolunteer}
                                                title={!canVolunteer ? `Join ${requiredTeam} to volunteer` : ''}
                                            >
                                                {canVolunteer ? <><UserPlus size={16} /> Volunteer</> : <><Lock size={14} /> Locked</>}
                                            </button>
                                        )}

                                        {isAssignedToMe && (
                                            <button
                                                className="btn-sm btn-text-danger"
                                                onClick={() => handleCancel(service.id, role)}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {services.length === 0 && (
                    <div className="empty-state">
                        <p>Loading schedule...</p>
                    </div>
                )}
            </div>

            <style>{`
        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .sub-text { color: var(--text-muted); font-weight: 500; }

        .roster-grid {
          display: grid;
          gap: 1.5rem;
        }

        .roster-card {
          border-left: 5px solid var(--color-primary);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .badge {
          background: #f3f4f6;
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .roles-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .role-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #f3f4f6;
        }

        .role-title {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .team-badge {
            font-size: 0.65rem;
            background: #e0e7ff;
            color: #3730a3;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .assignee {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.9rem;
        }

        .assignee.filled { color: var(--text-main); font-weight: 500; }
        .assignee.filled-me { color: var(--color-primary); font-weight: 700; }
        .assignee.empty { color: var(--text-muted); }

        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          border-radius: 6px;
        }

        .btn-outline {
          border: 1px solid var(--color-primary);
          color: var(--color-primary);
          background: transparent;
        }
        
        .btn-outline:hover {
          background: var(--color-primary);
          color: white;
        }

        .btn-disabled {
            background: #f3f4f6;
            color: #9ca3af;
            border: 1px solid #e5e7eb;
            cursor: not-allowed;
        }

        .btn-text-danger {
            background: transparent;
            color: #ef4444;
            border: none;
        }
        .btn-text-danger:hover {
            background: #fef2f2;
        }

      `}</style>
        </div>
    );
};

export default Roster;

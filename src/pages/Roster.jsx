import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays, startOfWeek } from 'date-fns';
import { CheckCircle, Circle, UserPlus } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

const Roster = () => {
    const { currentUser } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Mock Data Structure for initial view - eventually this comes from Firestore
    // We will deliver a working UI even without the DB populated yet
    const [services, setServices] = useState([
        {
            id: 'ws-1',
            date: new Date(), // Today
            type: 'Sunday Service',
            roles: {
                'Worship Leader': null,
                'Keys': null,
                'Drums': null,
                'Media/ProPresenter': 'uid-placeholder',
                'Sound': null
            }
        }
    ]);

    // In a real app, I'd fetch based on selectedDate

    const handleVolunteer = async (serviceId, role) => {
        // Optimistic UI update
        const updatedServices = services.map(service => {
            if (service.id === serviceId) {
                return {
                    ...service,
                    roles: {
                        ...service.roles,
                        [role]: currentUser.uid // volunteering self
                    }
                };
            }
            return service;
        });
        setServices(updatedServices);

        // TODO: Write to Firestore
        alert(`You have volunteered for: ${role}`);
    };

    return (
        <div className="animate-fade-in">
            <div className="header-flex">
                <h1>Service Roster</h1>
                <button className="btn btn-secondary">Previous</button>
                <span>{format(selectedDate, 'MMM d, yyyy')}</span>
                <button className="btn btn-secondary">Next</button>
            </div>

            <div className="roster-grid">
                {services.map(service => (
                    <div key={service.id} className="card roster-card">
                        <div className="card-header">
                            <h2>{service.type}</h2>
                            <span className="badge">{format(service.date, 'eeee, h:mm a')}</span>
                        </div>

                        <div className="roles-list">
                            {Object.entries(service.roles).map(([role, assigneeId]) => (
                                <div key={role} className="role-item">
                                    <div className="role-info">
                                        <span className="role-title">{role}</span>
                                        {assigneeId ? (
                                            <span className="assignee filled">
                                                <CheckCircle size={16} />
                                                {assigneeId === currentUser.uid ? 'You' : 'Assigned'}
                                            </span>
                                        ) : (
                                            <span className="assignee empty">
                                                <Circle size={16} /> Open
                                            </span>
                                        )}
                                    </div>

                                    {!assigneeId && (
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => handleVolunteer(service.id, role)}
                                        >
                                            <UserPlus size={16} /> Volunteer
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        .header-flex {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

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
          gap: 1rem;
        }

        .role-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #fafafa;
          border-radius: 8px;
        }

        .role-title {
          font-weight: 600;
          display: block;
        }

        .assignee {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .assignee.filled { color: #059669; }
        .assignee.empty { color: var(--text-muted); }

        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
        }

        .btn-outline {
          border: 1px solid var(--color-primary);
          color: var(--color-primary);
        }
        
        .btn-outline:hover {
          background: var(--color-primary);
          color: white;
        }
      `}</style>
        </div>
    );
};

export default Roster;

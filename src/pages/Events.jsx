import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Users, Plus, X, Trash2 } from 'lucide-react';
import L from 'leaflet';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove, query, where, getDocs, writeBatch } from 'firebase/firestore';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Events = () => {
    const { currentUser, isAdmin } = useAuth();
    const [events, setEvents] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [userMap, setUserMap] = useState({});

    // Form State
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: '',
        location: '',
        coordinates: [49.2827, -123.1207], // Default to Vancouver
        description: '',
        expiryDate: '' // New field for cleanup
    });

    // 1. Fetch User Names for RSVP Display
    useEffect(() => {
        const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const map = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                map[doc.id] = data.displayName || data.email;
            });
            setUserMap(map);
        });
        return () => unsubscribeUsers();
    }, []);

    // 2. Auto-Cleanup Expired Events
    useEffect(() => {
        const cleanupExpiredEvents = async () => {
            const now = new Date().toISOString();
            const q = query(
                collection(db, "events"),
                where("expiryDate", "<", now)
            );

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const batch = writeBatch(db);
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log(`Cleaned up ${snapshot.size} expired events.`);
            }
        };

        cleanupExpiredEvents();
    }, []);

    // 3. Fetch Events
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
            const eventsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by date (nearest first)
            eventsList.sort((a, b) => new Date(a.date) - new Date(b.date));
            setEvents(eventsList);
        });

        return () => unsubscribe();
    }, []);

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            // Default expiry to 24h after event if not set
            let expiry = newEvent.expiryDate;
            if (!expiry) {
                const eventDate = new Date(newEvent.date);
                eventDate.setDate(eventDate.getDate() + 1); // +1 day
                expiry = eventDate.toISOString();
            }

            await addDoc(collection(db, "events"), {
                ...newEvent,
                attendees: [], // Array of UIDs
                createdBy: currentUser.uid,
                expiryDate: expiry
            });
            setShowCreateModal(false);
            setNewEvent({
                title: '',
                date: '',
                location: '',
                coordinates: [49.2827, -123.1207],
                description: '',
                expiryDate: ''
            });
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event");
        }
    };

    const handleDeleteEvent = async (id) => {
        if (confirm("Are you sure you want to delete this event?")) {
            await deleteDoc(doc(db, "events", id));
        }
    };

    const handleRSVP = async (event, isJoining) => {
        const eventRef = doc(db, "events", event.id);
        try {
            if (isJoining) {
                await updateDoc(eventRef, {
                    attendees: arrayUnion(currentUser.uid)
                });
            } else {
                await updateDoc(eventRef, {
                    attendees: arrayRemove(currentUser.uid)
                });
            }
        } catch (error) {
            console.error("Error updating RSVP:", error);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="header-flex">
                <h1>Upcoming Events</h1>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> Create Event
                    </button>
                )}
            </div>

            <div className="events-grid">
                {events.map(event => {
                    const isAttending = (event.attendees || []).includes(currentUser.uid);
                    return (
                        <div key={event.id} className="card event-card">
                            <div className="event-map">
                                <MapContainer center={event.coordinates} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={event.coordinates}>
                                        <Popup>{event.location}</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>

                            <div className="event-details">
                                <div className="event-header">
                                    <h2>{event.title}</h2>
                                    {isAdmin && (
                                        <button className="btn-icon-danger" onClick={() => handleDeleteEvent(event.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="event-info">
                                    <div className="info-item">
                                        <Calendar size={16} />
                                        <span>{new Date(event.date).toLocaleString()}</span>
                                    </div>
                                    <div className="info-item">
                                        <MapPin size={16} />
                                        <span>{event.location}</span>
                                    </div>
                                    <div className="info-item">
                                        <Users size={16} />
                                        <span>{(event.attendees || []).length} Going</span>
                                    </div>
                                </div>

                                <p className="event-description">{event.description}</p>

                                <div className="attendees-list">
                                    <span className="attendees-label">Who's going:</span>
                                    <div className="avatars">
                                        {(event.attendees || []).map(uid => (
                                            <span key={uid} className="attendee-name" title={userMap[uid]}>
                                                {userMap[uid] || 'Unknown'}
                                            </span>
                                        ))}
                                        {(event.attendees || []).length === 0 && <span className="no-attendees">Be the first to join!</span>}
                                    </div>
                                </div>

                                <div className="event-actions">
                                    {isAttending ? (
                                        <button
                                            className="btn btn-outline-danger full-width"
                                            onClick={() => handleRSVP(event, false)}
                                        >
                                            Not Going
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-primary full-width"
                                            onClick={() => handleRSVP(event, true)}
                                        >
                                            RSVP Yes
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {events.length === 0 && (
                    <div className="empty-state">
                        <Calendar size={48} color="#e5e7eb" />
                        <p>No upcoming events scheduled.</p>
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal card">
                        <div className="modal-header">
                            <h2>Create New Event</h2>
                            <button onClick={() => setShowCreateModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateEvent}>
                            <div className="form-group">
                                <label>Event Title</label>
                                <input
                                    required
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={newEvent.date}
                                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Location Name</label>
                                <input
                                    required
                                    value={newEvent.location}
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Auto-Delete After (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={newEvent.expiryDate}
                                    onChange={e => setNewEvent({ ...newEvent, expiryDate: e.target.value })}
                                    placeholder="Empty = 24h after event"
                                />
                                <small className="help-text">Event will be deleted from cloud after this time.</small>
                            </div>
                            <button type="submit" className="btn btn-primary full-width">Create Event</button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .event-card {
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .event-map {
          height: 150px;
          background: #f3f4f6;
        }

        .event-details {
          padding: 1.25rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .event-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 0.5rem;
        }

        .event-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .event-description {
            margin-bottom: 1rem;
            font-size: 0.9rem;
            line-height: 1.4;
            flex-grow: 1;
        }
        
        .attendees-list {
            margin-bottom: 1rem;
            background: #f9fafb;
            padding: 0.5rem;
            border-radius: 6px;
        }

        .attendees-label {
            font-size: 0.75rem;
            color: var(--text-muted);
            font-weight: 600;
            display: block;
            margin-bottom: 0.25rem;
        }

        .avatars {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }

        .attendee-name {
            font-size: 0.75rem;
            background: #e5e7eb;
            padding: 2px 6px;
            border-radius: 4px;
        }

        .no-attendees {
            font-size: 0.75rem;
            color: var(--text-muted);
            font-style: italic;
        }

        .event-actions {
            margin-top: auto;
        }

        .full-width { width: 100%; }

        .btn-outline-danger {
            border: 1px solid #ef4444;
            color: #ef4444;
            background: transparent;
        }
        .btn-outline-danger:hover {
            background: #fef2f2;
        }

        .btn-icon-danger {
            color: #ef4444;
        }

        .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .modal {
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            font-size: 0.9rem;
        }

        .form-group input, .form-group textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
        }
        
        .help-text {
            font-size: 0.75rem;
            color: var(--text-muted);
        }
      `}</style>
        </div>
    );
};

export default Events;

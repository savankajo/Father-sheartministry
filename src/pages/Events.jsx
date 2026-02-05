import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Calendar as CalendarIcon, MapPin, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
import iconRead from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: iconRead,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Events = () => {
    const { isAdmin, currentUser } = useAuth();
    const [showAddForm, setShowAddForm] = useState(false);

    // Mock Events Data
    const [events, setEvents] = useState([
        {
            id: 1,
            title: "Sunday Special Service",
            date: "2026-02-15T10:00",
            locationName: "Main Sanctuary",
            coords: [49.2827, -123.1207], // Vancouver coords as example
            attendees: ['uid1', 'uid2'],
            declined: []
        },
        {
            id: 2,
            title: "Youth Night",
            date: "2026-02-18T19:00",
            locationName: "Community Hall",
            coords: [49.2820, -123.1200],
            attendees: [],
            declined: []
        }
    ]);

    const [newEvent, setNewEvent] = useState({
        title: '',
        date: '',
        locationName: '',
        lat: 49.2827,
        lng: -123.1207
    });

    const handleVote = (id, type) => {
        setEvents(events.map(ev => {
            if (ev.id === id) {
                const newAttendees = new Set(ev.attendees);
                const newDeclined = new Set(ev.declined);

                if (type === 'yes') {
                    newAttendees.add(currentUser.uid);
                    newDeclined.delete(currentUser.uid);
                } else {
                    newDeclined.add(currentUser.uid);
                    newAttendees.delete(currentUser.uid);
                }

                return {
                    ...ev,
                    attendees: Array.from(newAttendees),
                    declined: Array.from(newDeclined)
                };
            }
            return ev;
        }));
    };

    const handleAddEvent = (e) => {
        e.preventDefault();
        const event = {
            id: Date.now(),
            title: newEvent.title,
            date: newEvent.date,
            locationName: newEvent.locationName,
            coords: [parseFloat(newEvent.lat), parseFloat(newEvent.lng)],
            attendees: [],
            declined: []
        };
        setEvents([...events, event]);
        setShowAddForm(false);
        setNewEvent({ title: '', date: '', locationName: '', lat: 49.2827, lng: -123.1207 });
    };

    return (
        <div className="animate-fade-in">
            <div className="header-actions">
                <h1>Events & Locations</h1>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus size={18} /> Add Event
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="card add-event-form">
                    <h3>Create New Event</h3>
                    <form onSubmit={handleAddEvent}>
                        <input
                            placeholder="Event Title"
                            value={newEvent.title}
                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                            required
                        />
                        <input
                            type="datetime-local"
                            value={newEvent.date}
                            onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                            required
                        />
                        <input
                            placeholder="Location Name"
                            value={newEvent.locationName}
                            onChange={e => setNewEvent({ ...newEvent, locationName: e.target.value })}
                            required
                        />
                        <div className="coords-inputs">
                            <input
                                type="number" step="any" placeholder="Latitude"
                                value={newEvent.lat}
                                onChange={e => setNewEvent({ ...newEvent, lat: e.target.value })}
                                required
                            />
                            <input
                                type="number" step="any" placeholder="Longitude"
                                value={newEvent.lng}
                                onChange={e => setNewEvent({ ...newEvent, lng: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary">Save Event</button>
                    </form>
                </div>
            )}

            <div className="events-layout">
                <div className="events-list">
                    {events.map(ev => (
                        <div key={ev.id} className="card event-card">
                            <div className="event-info">
                                <h3>{ev.title}</h3>
                                <div className="event-meta">
                                    <span><CalendarIcon size={16} /> {new Date(ev.date).toLocaleString()}</span>
                                    <span><MapPin size={16} /> {ev.locationName}</span>
                                </div>

                                <div className="rsvp-section">
                                    <span className="rsvp-label">Can you make it?</span>
                                    <div className="rsvp-buttons">
                                        <button
                                            className={`btn-icon ${ev.attendees.includes(currentUser.uid) ? 'active-yes' : ''}`}
                                            onClick={() => handleVote(ev.id, 'yes')}
                                        >
                                            <ThumbsUp size={18} /> Yes ({ev.attendees.length})
                                        </button>
                                        <button
                                            className={`btn-icon ${ev.declined.includes(currentUser.uid) ? 'active-no' : ''}`}
                                            onClick={() => handleVote(ev.id, 'no')}
                                        >
                                            <ThumbsDown size={18} /> No
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="map-container card">
                    <MapContainer center={[49.2827, -123.1207]} zoom={12} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {events.map(ev => (
                            <Marker key={ev.id} position={ev.coords}>
                                <Popup>
                                    <b>{ev.title}</b><br />{ev.locationName}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            <style>{`
        .header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .events-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .events-layout { grid-template-columns: 1fr; }
          .map-container { height: 300px; }
        }

        .map-container {
          height: 600px;
          padding: 0;
          overflow: hidden;
          position: sticky;
          top: 90px;
        }

        .event-card {
          margin-bottom: 1rem;
          border-left: 4px solid var(--color-accent);
        }

        .event-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          color: var(--text-muted);
          margin: 1rem 0;
          font-size: 0.9rem;
        }

        .event-meta span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rsvp-section {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .rsvp-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-muted);
        }

        .rsvp-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          background: white;
          border: 1px solid #e5e7eb;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #f3f4f6;
        }

        .active-yes {
          background: #ecfdf5;
          border-color: #059669;
          color: #059669;
        }

        .active-no {
          background: #fef2f2;
          border-color: #dc2626;
          color: #dc2626;
        }

        .add-event-form {
          margin-bottom: 2rem;
          background: #fff;
        }
        
        .add-event-form input {
          width: 100%;
          padding: 0.75rem;
          margin-bottom: 1rem;
          border: 1px solid #ddd;
          border-radius: 6px;
        }

        .coords-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
      `}</style>
        </div>
    );
};

export default Events;

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const ActionCard = ({ icon, title, desc, path, color }) => (
        <div
            className="card action-card"
            onClick={() => navigate(path)}
            style={{ borderTop: `4px solid ${color}` }}
        >
            <div className="icon-wrapper" style={{ color: color }}>
                {icon}
            </div>
            <h3>{title}</h3>
            <p>{desc}</p>
        </div>
    );

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    Welcome, {currentUser.displayName || 'Member'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    What would you like to do today?
                </p>
            </header>

            <div className="dashboard-grid">
                <ActionCard
                    icon={<Calendar size={32} />}
                    title="Upcoming Events"
                    desc="View service times, locations, and RSVP."
                    path="/events"
                    color="var(--color-primary)"
                />

                <ActionCard
                    icon={<Users size={32} />}
                    title="Service Roster"
                    desc="Check when you're serving or volunteer."
                    path="/roster"
                    color="var(--color-secondary)" // Navy
                />

                <ActionCard
                    icon={<MessageSquare size={32} />}
                    title="Team Chat"
                    desc="Connect with your ministry teams."
                    path="/teams"
                    color="var(--color-accent)" // Gold/Yellow
                />
            </div>

            <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .action-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }

        .action-card h3 {
          font-size: 1.25rem;
        }

        .action-card p {
          color: var(--text-muted);
          line-height: 1.5;
        }

        .icon-wrapper {
          background: rgba(0,0,0,0.03);
          width: fit-content;
          padding: 1rem;
          border-radius: 50%;
          margin-bottom: 0.5rem;
        }
      `}</style>
        </div>
    );
};

export default Dashboard;

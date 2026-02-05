import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Home, Calendar, Users, MessageSquare, LogOut, Shield } from 'lucide-react';
import '../index.css';

const Navbar = () => {
    const { currentUser, isAdmin, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
        { name: 'Service Roster', path: '/roster', icon: <Users size={20} /> },
        { name: 'Events', path: '/events', icon: <Calendar size={20} /> },
        { name: 'Teams & Chat', path: '/teams', icon: <MessageSquare size={20} /> },
    ];

    if (isAdmin) {
        navItems.push({ name: 'Admin', path: '/admin', icon: <Shield size={20} /> });
    }

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <div className="nav-brand">
                    <span className="brand-text">Father Heart</span>
                </div>

                {/* Desktop Menu */}
                <div className="nav-menu desktop-only">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                    <button onClick={handleLogout} className="nav-link logout-btn">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button className="mobile-toggle mobile-only" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="mobile-menu mobile-only">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                    <button onClick={handleLogout} className="mobile-link logout-btn-mobile">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            )}

            <style>{`
        .navbar {
          background-color: var(--bg-card);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: 50;
          height: 70px;
          display: flex;
          align-items: center;
        }

        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .brand-text {
          font-family: var(--font-headline);
          font-weight: 800;
          font-size: 1.5rem;
          color: var(--color-primary);
          letter-spacing: -0.5px;
        }

        .nav-menu {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-link:hover {
          background-color: var(--bg-body);
          color: var(--color-primary);
        }

        .nav-link.active {
          background-color: rgba(var(--color-primary-h), 50%, 95%, 0.1); 
          color: var(--color-primary);
          background: #fff0f0; /* Fallback light red */
        }

        .logout-btn {
          color: #ef4444; 
          margin-left: 1rem;
        }
        
        .logout-btn:hover {
          background: #fee2e2;
          color: #b91c1c;
        }

        .mobile-only { display: none; }
        
        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .mobile-only { display: flex; }
          
          .mobile-menu {
            position: absolute;
            top: 70px;
            left: 0;
            right: 0;
            background: var(--bg-card);
            border-top: 1px solid #f3f4f6;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            box-shadow: var(--shadow-md);
          }

          .mobile-link {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            color: var(--text-main);
            text-decoration: none;
            border-radius: 8px;
          }
          
          .mobile-link.active {
            background: #fff0f0;
            color: var(--color-primary);
          }
        }
      `}</style>
        </nav>
    );
};

export default Navbar;

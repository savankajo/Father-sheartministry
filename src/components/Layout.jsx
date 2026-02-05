import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
            <Navbar />
            <main className="container" style={{ paddingBottom: '2rem', paddingTop: '2rem' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;

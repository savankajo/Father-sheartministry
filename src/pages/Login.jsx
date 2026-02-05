import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, name);
            }
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Failed to ' + (isLogin ? 'log in' : 'create an account') + ': ' + err.message);
        }
        setLoading(false);
    }

    return (
        <div className="auth-container">
            <div className="auth-card animate-fade-in">
                <h1 className="auth-title">Father Heart Church</h1>
                <p className="auth-subtitle">{isLogin ? 'Welcome back, family.' : 'Join our community.'}</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <button disabled={loading} type="submit" className="btn btn-primary auth-btn">
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="auth-footer">
                    {isLogin ? "Need an account? " : "Already have an account? "}
                    <span onClick={() => setIsLogin(!isLogin)} className="auth-link">
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </span>
                </div>
            </div>

            <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-primary) 0%, #1a1a2e 100%);
          padding: 1rem;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 2.5rem;
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .auth-title {
          text-align: center;
          color: var(--color-primary);
          margin-bottom: 0.5rem;
          font-weight: 800;
        }

        .auth-subtitle {
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 2rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .form-group input {
          padding: 0.8rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          border-color: var(--color-primary);
          outline: none;
        }

        .auth-btn {
          margin-top: 1rem;
          font-size: 1rem;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .auth-link {
          color: var(--color-primary);
          font-weight: 600;
          cursor: pointer;
        }
        
        .auth-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          text-align: center;
        }
      `}</style>
        </div>
    );
};

export default Login;

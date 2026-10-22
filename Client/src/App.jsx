import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './Auth/Login';
import Register from './Auth/Register';
import Dashboard from './Dashboard/Dashboard';
import VerifyCertificate from './Dashboard/VerifyCertificate';
import './Auth/Auth.css';

function LandingPage() {
    return (
        <div className="auth-container">
            <div className="glass-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                <div className="card-header">
                    <h2>AI Smart Study Planner</h2>
                    <p>Optimize your learning schedule with AI-driven planners</p>
                </div>
                
                <div style={{ color: '#cbd5e1', margin: '20px 0', fontSize: '0.95rem' }}>
                    <p>
                        Track study progress, customize schedules, and achieve academic success with our intelligent dashboard.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <button className="auth-btn" style={{ width: '100%' }}>
                            Get Started (Log In)
                        </button>
                    </Link>
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                        <button className="auth-btn" style={{ width: '100%', background: 'transparent', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc', boxShadow: 'none' }}>
                            Create New Account
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/verify/:certId" element={<VerifyCertificate />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;

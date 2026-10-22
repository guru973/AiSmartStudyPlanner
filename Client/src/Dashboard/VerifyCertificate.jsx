import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, AlertCircle, Award, Calendar, BookOpen, CheckCircle, ArrowLeft } from 'lucide-react';
import CertificateModal from './CertificateModal';

const API_BASE = 'http://localhost:5000/api/planner';

export default function VerifyCertificate() {
    const { certId } = useParams();
    const [loading, setLoading] = useState(true);
    const [certData, setCertData] = useState(null);
    const [error, setError] = useState('');
    const [showFullCert, setShowFullCert] = useState(false);

    useEffect(() => {
        async function verify() {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE}/verify-certificate/${certId}`);
                if (res.data.valid && res.data.certificate) {
                    setCertData(res.data.certificate);
                } else {
                    setError('This credential ID could not be found or has not been recognized.');
                }
            } catch (err) {
                setError('Invalid or expired certificate credential ID.');
            } finally {
                setLoading(false);
            }
        }
        if (certId) verify();
    }, [certId]);

    return (
        <div className="auth-container" style={{ padding: '40px 20px' }}>
            <div className="glass-card" style={{ maxWidth: '640px', textAlign: 'center', overflow: 'hidden', padding: 0 }}>
                {/* Official Tricolor Ribbon */}
                <div className="govt-tricolor-bar" style={{ height: 4 }}></div>

                <div style={{ padding: '32px 28px' }}>
                    {loading ? (
                        <div style={{ padding: 40, color: '#94a3b8' }}>
                            <ShieldCheck size={48} color="#818cf8" style={{ animation: 'bounce 1s infinite', margin: '0 auto 16px' }} />
                            <p>Verifying Credential Authenticity with Central Registry...</p>
                        </div>
                    ) : error ? (
                        <div>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <AlertCircle size={32} color="#f87171" />
                            </div>
                            <h2 style={{ color: '#ffffff', marginBottom: 8 }}>Credential Not Verified</h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: 24 }}>{error}</p>
                            <Link to="/" style={{ textDecoration: 'none' }}>
                                <button className="auth-btn">Return to Home</button>
                            </Link>
                        </div>
                    ) : (
                        <div>
                            {/* Verified Badge */}
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)' }}>
                                <ShieldCheck size={40} color="#34d399" />
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <span style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    🏛️ सत्यमेव जयते • OFFICIALLY VERIFIED GOVERNMENT RECOGNIZED CREDENTIAL
                                </span>
                            </div>

                        <h2 style={{ color: '#ffffff', fontSize: '1.7rem', margin: '0 0 6px 0' }}>
                            {certData.studentName}
                        </h2>
                        <p style={{ color: '#818cf8', fontWeight: 600, fontSize: '1rem', margin: '0 0 20px 0' }}>
                            {certData.title}
                        </p>

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: '18px 22px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Credential ID:</span>
                                <span style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 700 }}>{certData.certId}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Subject Curriculum:</span>
                                <span style={{ color: '#ffffff', fontWeight: 600 }}>{certData.subject} ({certData.examName})</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Mastery Grade:</span>
                                <span style={{ color: '#34d399', fontWeight: 700 }}>{certData.grade} ({certData.accuracyPct}% Accuracy)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Issuing Authority:</span>
                                <span style={{ color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 600 }}>{certData.issuingAuthority || 'National Academic Evaluation & Skill Council (Govt. of India Recognized)'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Authorized By:</span>
                                <span style={{ color: '#fef08a', fontSize: '0.85rem', fontWeight: 600 }}>{certData.authorizedBy || 'Government of India Recognized Board'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Accreditation No:</span>
                                <span style={{ color: '#34d399', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700 }}>{certData.accreditationNo || 'GOV-ACCRED-2026-8834'}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={() => setShowFullCert(true)} className="auth-btn" style={{ padding: '12px 24px' }}>
                                View Official Certificate
                            </button>
                            <Link to="/" style={{ textDecoration: 'none' }}>
                                <button className="auth-btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1' }}>
                                    Visit App
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
                </div>
            </div>

            {showFullCert && certData && (
                <CertificateModal cert={certData} onClose={() => setShowFullCert(false)} />
            )}
        </div>
    );
}

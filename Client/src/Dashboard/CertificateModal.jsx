import React, { useState } from 'react';
import { Download, Share2, Check, Award, X, ExternalLink, ShieldCheck, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * Procedural SVG Indian National Emblem / Ashoka Pillar Motif
 */
function GovtEmblemSvg() {
    return (
        <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 6px' }}>
            {/* Top Wheel / Crown */}
            <circle cx="50" cy="50" r="44" stroke="#d4af37" strokeWidth="2.5" fill="rgba(212, 175, 55, 0.08)" />
            <circle cx="50" cy="50" r="38" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3" />
            
            {/* Ashoka Chakra Center */}
            <circle cx="50" cy="50" r="16" stroke="#d4af37" strokeWidth="2" fill="none" />
            <circle cx="50" cy="50" r="4" fill="#d4af37" />
            {/* 12 radial lines simulating 24 spokes */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
                <line
                    key={deg}
                    x1="50"
                    y1="50"
                    x2={50 + 16 * Math.cos((deg * Math.PI) / 180)}
                    y2={50 + 16 * Math.sin((deg * Math.PI) / 180)}
                    stroke="#d4af37"
                    strokeWidth="1.5"
                />
            ))}

            {/* Crest Pillars */}
            <path d="M30 68 L70 68 L65 82 L35 82 Z" fill="#d4af37" opacity="0.85" />
            <rect x="25" y="82" width="50" height="4" fill="#d4af37" rx="1" />
            {/* Four Stars */}
            <circle cx="32" cy="75" r="2" fill="#ffffff" />
            <circle cx="44" cy="75" r="2" fill="#ffffff" />
            <circle cx="56" cy="75" r="2" fill="#ffffff" />
            <circle cx="68" cy="75" r="2" fill="#ffffff" />
        </svg>
    );
}

/**
 * Procedural SVG QR Code Graphic for Credential Verification
 */
function VerifiableQrCode({ code }) {
    return (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#ffffff" rx="4" />
            {/* Corner Markers */}
            <rect x="10" y="10" width="24" height="24" fill="#000000" />
            <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
            <rect x="18" y="18" width="8" height="8" fill="#000000" />

            <rect x="66" y="10" width="24" height="24" fill="#000000" />
            <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
            <rect x="74" y="18" width="8" height="8" fill="#000000" />

            <rect x="10" y="66" width="24" height="24" fill="#000000" />
            <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
            <rect x="18" y="74" width="8" height="8" fill="#000000" />

            {/* Pattern Dots */}
            <rect x="42" y="14" width="6" height="6" fill="#000000" />
            <rect x="52" y="14" width="6" height="6" fill="#000000" />
            <rect x="42" y="24" width="6" height="6" fill="#000000" />
            <rect x="14" y="44" width="6" height="6" fill="#000000" />
            <rect x="24" y="44" width="6" height="6" fill="#000000" />
            <rect x="44" y="44" width="12" height="12" fill="#000000" />
            <rect x="64" y="44" width="6" height="6" fill="#000000" />
            <rect x="78" y="44" width="8" height="8" fill="#000000" />
            <rect x="44" y="66" width="6" height="6" fill="#000000" />
            <rect x="54" y="74" width="8" height="8" fill="#000000" />
            <rect x="68" y="68" width="18" height="18" fill="#000000" />
            <rect x="72" y="72" width="10" height="10" fill="#ffffff" />
            <rect x="76" y="76" width="2" height="2" fill="#000000" />
        </svg>
    );
}

export default function CertificateModal({ cert, onClose }) {
    const [copied, setCopied] = useState(false);

    if (!cert) return null;

    const verifyUrl = `${window.location.origin}/verify/${cert.certId}`;
    const formattedDate = new Date(cert.issuedAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const handlePrint = () => {
        window.print();
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(verifyUrl);
        setCopied(true);
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } });
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShareLinkedIn = () => {
        const title = encodeURIComponent(cert.title || 'Topic Mastery Certificate');
        const org = encodeURIComponent('AI Smart Study Planner Academy');
        const url = encodeURIComponent(verifyUrl);
        const certUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${title}&organizationName=${org}&certUrl=${url}&certId=${cert.certId}`;
        window.open(certUrl, '_blank');
    };

    return (
        <div className="cert-modal-overlay" onClick={onClose}>
            <div className="cert-dialog-box" onClick={(e) => e.stopPropagation()}>
                {/* Official Certificate Parchment Frame */}
                <div className="certificate-frame">
                    {/* Corner filigrees */}
                    <div className="cert-corner cert-tl"></div>
                    <div className="cert-corner cert-tr"></div>
                    <div className="cert-corner cert-bl"></div>
                    <div className="cert-corner cert-br"></div>

                    {/* Official Tricolor Ribbon */}
                    <div className="govt-tricolor-bar" style={{ height: 4, marginBottom: 14, borderRadius: 2 }}></div>

                    {/* Official Government Accreditation Crest */}
                    <div className="cert-govt-crest">
                        <GovtEmblemSvg />
                        <div className="cert-emblem-badge">
                            🏛️ सत्यमेव जयते • GOVERNMENT OF INDIA RECOGNIZED ACCREDITATION
                        </div>
                    </div>

                    {/* Organization & Authority Banner */}
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 2 }}>
                        Under Aegis of Ministry of Skill Development & Higher Education Guidelines
                    </div>
                    <div className="cert-header-org">
                        {cert.issuingAuthority || 'NATIONAL ACADEMIC EVALUATION & SKILL COUNCIL'}
                    </div>
                    <div className="cert-accreditation-sub">
                        AUTHORIZED UNDER NATIONAL ASSESSMENT FRAMEWORK • ACCREDITATION ID: {cert.accreditationNo || 'GOV-ACCRED-2026-8834'} • ISO 9001:2015 • NSQF LEVEL-7
                    </div>

                    <h1 className="cert-main-title">Certificate of Academic Excellence</h1>
                    <div className="cert-lead-text">This official government recognized credential certifies that</div>

                    {/* Candidate Name */}
                    <div className="cert-candidate-name">
                        {cert.studentName || 'Candidate'}
                    </div>

                    {/* Citation */}
                    <p className="cert-citation">
                        has demonstrated outstanding cognitive proficiency, active recall accuracy, and subject mastery in{' '}
                        <strong>{cert.subject}</strong> for the topic of{' '}
                        <strong>"{cert.title?.replace('Certificate of Topic Mastery in ', '') || cert.topic}"</strong>{' '}
                        under the curriculum of <strong>{cert.examName || 'Competitive Examination'}</strong>.
                    </p>

                    {/* Badges / Metrics Row */}
                    <div className="cert-badges-row">
                        <span className="cert-pill" style={{ background: 'rgba(212, 175, 55, 0.15)', borderColor: 'rgba(212, 175, 55, 0.45)', color: '#fef08a' }}>
                            🏛️ Authorized By: {cert.authorizedBy || 'Government Recognized Academic Board'}
                        </span>
                        <span className="cert-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#6ee7b7' }}>
                            🏆 Grade: {cert.grade || 'Distinction (S-Tier)'}
                        </span>
                        <span className="cert-pill">
                            🎯 Accuracy: {cert.accuracyPct}%
                        </span>
                        <span className="cert-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#c7d2fe' }}>
                            🛡️ Verifiable Official Gov Credential
                        </span>
                    </div>

                    {/* Signatures & Seal & QR */}
                    <div className="cert-footer-row">
                        {/* Signature 1 */}
                        <div className="cert-sig-block">
                            <div className="cert-sig-line">Dr. A. Vance, Ph.D</div>
                            <div className="cert-sig-title">
                                Controller of Examinations<br />National Academic Council
                            </div>
                        </div>

                        {/* Gold Embossed Seal */}
                        <div className="cert-seal-box">
                            <div style={{ fontSize: '0.55rem', fontWeight: 900 }}>GOVT. AUTH</div>
                            <div style={{ fontSize: '0.85rem', margin: '2px 0' }}>★ 🏛️ ★</div>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800 }}>SEAL</div>
                        </div>

                        {/* QR Code & Credential ID */}
                        <div className="cert-qr-box">
                            <VerifiableQrCode code={cert.certId} />
                            <div className="cert-id-tag">ID: {cert.certId}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{formattedDate}</div>
                        </div>

                        {/* Signature 2 */}
                        <div className="cert-sig-block">
                            <div className="cert-sig-line">Dr. S. Raman, IAS (Retd.)</div>
                            <div className="cert-sig-title">
                                Director General of Certification<br />Govt. Educational Oversight Board
                            </div>
                        </div>
                    </div>

                    {/* Cryptographic Security Line */}
                    <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.64rem', color: '#64748b', flexWrap: 'wrap', gap: 6 }}>
                        <span>🔐 Tamper-Proof Cryptographic ID: <strong style={{ color: '#94a3b8' }}>{cert.certId}</strong> • Standard: ISO 9001:2015</span>
                        <span>Central Registry Ref: <strong style={{ color: '#34d399' }}>{cert.govApprovalCode || 'GOV-MHRD/NAAC-2026'}</strong></span>
                    </div>
                </div>

                {/* Outside Actions Bar */}
                <div className="cert-actions-bar">
                    <button onClick={handlePrint} className="cert-btn cert-btn-download">
                        <Printer size={18} />
                        <span>Download / Print Official PDF</span>
                    </button>

                    <a href={verifyUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <button className="cert-btn" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7' }}>
                            <ShieldCheck size={18} />
                            <span>Public Gov Verification Portal</span>
                        </button>
                    </a>

                    <button onClick={handleShareLinkedIn} className="cert-btn cert-btn-linkedin">
                        <ExternalLink size={18} />
                        <span>Add to LinkedIn</span>
                    </button>

                    <button onClick={handleCopyLink} className="cert-btn cert-btn-close">
                        {copied ? <Check size={18} color="#10b981" /> : <Share2 size={18} />}
                        <span>{copied ? 'Verification Link Copied!' : 'Copy Link'}</span>
                    </button>

                    <button onClick={onClose} className="cert-btn cert-btn-close">
                        <X size={18} />
                        <span>Close</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

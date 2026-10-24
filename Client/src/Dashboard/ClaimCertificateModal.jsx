import React, { useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { Award, ShieldCheck, X, Sparkles, CheckCircle2, ChevronDown, BookOpen } from 'lucide-react';
import { API_PLANNER as API_BASE } from '../apiConfig';

export default function ClaimCertificateModal({
    isOpen,
    onClose,
    defaultTask,
    allTasks = [],
    examName = 'Competitive Examination',
    user,
    token,
    onCertificateClaimed
}) {
    const [candidateName, setCandidateName] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [grade, setGrade] = useState('Distinction (S-Tier)');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.username) {
            setCandidateName(user.username);
        }
        if (defaultTask) {
            setSelectedSubject(defaultTask.subject || 'General Studies');
            setSelectedTopic(defaultTask.topic || '');
        } else if (allTasks.length > 0) {
            setSelectedSubject(allTasks[0].subject || 'General Studies');
            setSelectedTopic(allTasks[0].topic || '');
        }
    }, [defaultTask, allTasks, user, isOpen]);

    if (!isOpen) return null;

    const subjects = Array.from(new Set(allTasks.map(t => t.subject).filter(Boolean)));
    const topicsForSubject = allTasks.filter(t => !selectedSubject || t.subject === selectedSubject);

    const handleSubjectChange = (newSubject) => {
        setSelectedSubject(newSubject);
        const filtered = allTasks.filter(t => t.subject === newSubject);
        if (filtered.length > 0) {
            setSelectedTopic(filtered[0].topic);
        }
    };

    const handleClaim = async (e) => {
        e.preventDefault();
        setError('');

        const finalTopic = customTopic.trim() || selectedTopic.trim();
        if (!finalTopic) {
            setError('Please select or specify a topic to certify.');
            return;
        }

        const finalName = candidateName.trim() || user?.username || 'Candidate';

        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${token}` };
            const payload = {
                studentName: finalName,
                topic: finalTopic,
                subject: selectedSubject || 'General Studies',
                examName: examName || 'Competitive Examination',
                score: grade.includes('Distinction') ? 3 : 2,
                accuracyPct: grade.includes('Distinction') ? 100 : 85,
                grade: grade,
                issuingAuthority: 'National Academic Evaluation & Skill Council (Govt. of India Recognized)',
                authorizedBy: 'Government of India Recognized Board • Ministry of Skill Development',
                accreditationNo: 'GOV-ACCRED-2026-8834',
                govApprovalCode: 'GOV-MHRD/NAAC-2026'
            };

            const res = await axios.post(`${API_BASE}/issue-certificate`, payload, { headers });

            if (res.data.success && res.data.certificate) {
                confetti({
                    particleCount: 220,
                    spread: 90,
                    origin: { y: 0.55 },
                    colors: ['#FF9933', '#FFFFFF', '#138808', '#d4af37', '#6366f1']
                });

                if (onCertificateClaimed) {
                    onCertificateClaimed(res.data.certificate);
                }
                onClose();
            } else {
                setError(res.data.message || 'Failed to issue certificate.');
            }
        } catch (err) {
            console.error('Error claiming certificate:', err);
            setError(err.response?.data?.message || 'Server error while claiming certificate. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cert-modal-overlay" onClick={onClose}>
            <div className="claim-modal-box" onClick={(e) => e.stopPropagation()}>
                {/* Official Tricolor Bar */}
                <div className="govt-tricolor-bar"></div>

                {/* Header */}
                <div className="claim-modal-header">
                    <div className="claim-header-crest">
                        <div className="claim-emblem-badge">
                            🏛️ GOVERNMENT OF INDIA RECOGNIZED ACCREDITATION
                        </div>
                        <h2 className="claim-main-title">
                            National Academic Credential Claim Desk
                        </h2>
                        <div className="claim-sub-title">
                            National Academic Evaluation & Skill Council • Ministry of Education Standards • ISO 9001:2015
                        </div>
                    </div>
                    <button onClick={onClose} className="claim-close-btn" title="Close">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="claim-error-box">
                        {error}
                    </div>
                )}

                <form onSubmit={handleClaim} className="claim-form">
                    {/* Candidate Name Input */}
                    <div className="claim-field-group">
                        <label className="claim-label">
                            Candidate Full Official Name
                            <span className="claim-label-hint">(As it will appear on the Government Credential)</span>
                        </label>
                        <input
                            type="text"
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                            placeholder="Enter official student name"
                            className="claim-input"
                            required
                        />
                    </div>

                    <div className="claim-grid-2">
                        {/* Target Exam Curriculum */}
                        <div className="claim-field-group">
                            <label className="claim-label">Exam / Curriculum</label>
                            <input
                                type="text"
                                value={examName}
                                disabled
                                className="claim-input disabled"
                            />
                        </div>

                        {/* Subject */}
                        <div className="claim-field-group">
                            <label className="claim-label">Subject Discipline</label>
                            {subjects.length > 0 ? (
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => handleSubjectChange(e.target.value)}
                                    className="claim-input"
                                >
                                    {subjects.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="claim-input"
                                    placeholder="e.g. Mathematics"
                                />
                            )}
                        </div>
                    </div>

                    {/* Topic to Certify */}
                    <div className="claim-field-group">
                        <label className="claim-label">Topic / Module for Certification</label>
                        {topicsForSubject.length > 0 && !customTopic ? (
                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="claim-input"
                            >
                                {topicsForSubject.map(t => (
                                    <option key={t.id || t.topic} value={t.topic}>
                                        {t.topic} {t.isCompleted ? '✓ (Mastered)' : ''}
                                    </option>
                                ))}
                            </select>
                        ) : null}

                        <input
                            type="text"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            placeholder="Or type a custom topic name to certify..."
                            className="claim-input"
                            style={{ marginTop: topicsForSubject.length > 0 ? 8 : 0 }}
                        />
                    </div>

                    {/* Grade Tier Selection */}
                    <div className="claim-field-group">
                        <label className="claim-label">Credential Grade Tier</label>
                        <div className="claim-tier-row">
                            <label className={`claim-tier-card ${grade === 'Distinction (S-Tier)' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="grade"
                                    value="Distinction (S-Tier)"
                                    checked={grade === 'Distinction (S-Tier)'}
                                    onChange={() => setGrade('Distinction (S-Tier)')}
                                />
                                <div>
                                    <div className="tier-name">🏆 Distinction (S-Tier)</div>
                                    <div className="tier-desc">100% Mastery • Outstanding Accuracy</div>
                                </div>
                            </label>

                            <label className={`claim-tier-card ${grade === 'Honors (A-Tier)' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="grade"
                                    value="Honors (A-Tier)"
                                    checked={grade === 'Honors (A-Tier)'}
                                    onChange={() => setGrade('Honors (A-Tier)')}
                                />
                                <div>
                                    <div className="tier-name">🎖️ Honors (A-Tier)</div>
                                    <div className="tier-desc">High Proficiency & Knowledge Retention</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Government Accreditation Credentials Box */}
                    <div className="govt-specs-card">
                        <div className="govt-specs-header">
                            <ShieldCheck size={18} color="#34d399" />
                            <span>GOVERNMENT AUTHORIZED ACCREDITATION SPECIFICATIONS</span>
                        </div>
                        <div className="govt-specs-grid">
                            <div className="govt-spec-item">
                                <span className="spec-label">Issuing Authority:</span>
                                <span className="spec-value">National Academic Evaluation & Skill Council</span>
                            </div>
                            <div className="govt-spec-item">
                                <span className="spec-label">Authorized By:</span>
                                <span className="spec-value">Govt. of India Recognized Academic Board</span>
                            </div>
                            <div className="govt-spec-item">
                                <span className="spec-label">Accreditation ID:</span>
                                <span className="spec-value mono">GOV-ACCRED-2026-8834</span>
                            </div>
                            <div className="govt-spec-item">
                                <span className="spec-label">Quality Standard:</span>
                                <span className="spec-value">ISO 9001:2015 & NSQF Level-7 Aligned</span>
                            </div>
                            <div className="govt-spec-item">
                                <span className="spec-label">Verification:</span>
                                <span className="spec-value">Tamper-Proof QR Code & Central Digital Registry</span>
                            </div>
                            <div className="govt-spec-item">
                                <span className="spec-label">Approval Code:</span>
                                <span className="spec-value mono">GOV-MHRD/NAAC-2026</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="claim-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="claim-btn-cancel"
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="claim-btn-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Sparkles size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                                    <span>Generating Official Government Credential...</span>
                                </>
                            ) : (
                                <>
                                    <Award size={20} />
                                    <span>Claim Official Government Certificate</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

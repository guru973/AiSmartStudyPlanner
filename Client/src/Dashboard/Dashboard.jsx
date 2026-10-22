import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import {
    Sparkles,
    Calendar,
    Clock,
    CheckCircle2,
    Circle,
    Flame,
    BookOpen,
    Upload,
    Play,
    Pause,
    RotateCcw,
    Trash2,
    Award,
    LogOut,
    CheckSquare,
    Layers,
    Timer,
    BarChart2,
    AlertCircle,
    Volume2,
    VolumeX,
    Maximize2,
    Minimize2,
    Brain,
    HelpCircle,
    Send,
    X,
    Columns,
    List,
    Search,
    ChevronRight,
    ChevronDown,
    Trophy,
    Target,
    Zap,
    TrendingUp,
    Check,
    AlertTriangle,
    ArrowRight,
    ShieldCheck,
    Share2,
    MessageCircle,
    RefreshCw,
    Crown,
    Medal,
    Download
} from 'lucide-react';
import { playAmbientSound, stopAmbientSound, setAmbientVolume } from './audioEngine';
import CertificateModal from './CertificateModal';
import ClaimCertificateModal from './ClaimCertificateModal';
import './Dashboard.css';

const API_BASE = 'http://localhost:5000/api/planner';

export default function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');

    // Main planner state
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [metrics, setMetrics] = useState({
        totalTasks: 0,
        completedTasks: 0,
        progressPercentage: 0,
        todaysTasksCount: 0
    });

    // View & Tab navigation
    const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'pomodoro' | 'arena' | 'analytics'
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
    const [dayFilter, setDayFilter] = useState('all'); // 'all' | 'today' | number
    const [searchQuery, setSearchQuery] = useState('');

    // Gamification state (stored in localStorage)
    const [xp, setXp] = useState(() => Number(localStorage.getItem('study_xp')) || 250);
    const [streak] = useState(3);
    const level = Math.floor(xp / 200) + 1;
    const xpCurrentLevel = xp % 200;

    const addXp = (amount) => {
        setXp(prev => {
            const next = prev + amount;
            localStorage.setItem('study_xp', next);
            return next;
        });
    };

    // Plan Creation Form state
    const [examName, setExamName] = useState('RRB NTPC');
    const [examDate, setExamDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 45);
        return d.toISOString().split('T')[0];
    });
    const [dailyHours, setDailyHours] = useState(3.0);
    const [syllabusText, setSyllabusText] = useState('');
    const [pdfUploading, setPdfUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState('');

    // Pomodoro Timer state
    const [timerMode, setTimerMode] = useState(25);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [zenMode, setZenMode] = useState(false);

    // Ambient Soundscape state
    const [ambientTrack, setAmbientTrack] = useState('none'); // 'none' | 'binaural' | 'rain' | 'zen'
    const [ambientVol, setAmbientVol] = useState(0.5);

    // AI Study Coach Drawer state
    const [isCoachOpen, setIsCoachOpen] = useState(false);
    const [coachPrompt, setCoachPrompt] = useState('');
    const [coachLoading, setCoachLoading] = useState(false);
    const [coachHistory, setCoachHistory] = useState([
        {
            role: 'assistant',
            text: 'Hello! I am your AI Study Coach. Ask me any doubt, formula cheat-sheet, or study strategy to conquer your exam syllabus!'
        }
    ]);

    // AI Active Recall Quiz Modal state
    const [quizModalOpen, setQuizModalOpen] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [activeQuizTask, setActiveQuizTask] = useState(null);
    const [quizStep, setQuizStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [quizScore, setQuizScore] = useState(0);
    const [quizAnswersRecord, setQuizAnswersRecord] = useState([]);
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    const [showReviewDetails, setShowReviewDetails] = useState(false);

    // Quiz History & Stats
    const [quizStats, setQuizStats] = useState({ totalQuizzes: 0, avgAccuracy: 0, history: [] });

    // Official Certificates state
    const [claimedCertificate, setClaimedCertificate] = useState(null);
    const [myCertificates, setMyCertificates] = useState([]);
    const [isIssuingCert, setIsIssuingCert] = useState(false);
    const [certViewMode, setCertViewMode] = useState('table');
    const [claimModalOpen, setClaimModalOpen] = useState(false);
    const [taskToCertify, setTaskToCertify] = useState(null);
    const [selectedBadge, setSelectedBadge] = useState(null);

    // Live Exam Countdown & Motivation Quotes
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [quoteIdx, setQuoteIdx] = useState(0);

    const MOTIVATIONAL_QUOTES = [
        { text: "தூங்கும்போது வருவதல்ல கனவு; உன்னை தூங்கவிடாமல் செய்வதே உண்மையான கனவு!", author: "Dr. A.P.J. Abdul Kalam" },
        { text: "Arise, awake, and stop not until the goal is reached.", author: "Swami Vivekananda" },
        { text: "Consistency in active recall turns average preparation into All-India Rank #1.", author: "UPSC/GATE Ranker Strategy" },
        { text: "One hour of deep focus today saves you one full year of regret tomorrow.", author: "Civil Services Mentor" },
        { text: "தோல்வி என்பது முடிவு அல்ல, அது வெற்றிக்கான முதல் படி!", author: "IAS Academy Motto" },
        { text: "The secret to clearing any competitive exam is simple: Complete today's daily target without excuses.", author: "Exam Topper Mindset" }
    ];

    const currentQuote = MOTIVATIONAL_QUOTES[quoteIdx];

    // Live countdown effect
    useEffect(() => {
        if (!plan?.examDate) return;
        const target = new Date(plan.examDate).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = Math.max(0, target - now);

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ days, hours, minutes, seconds });
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [plan?.examDate]);

    // All-India Mock Rank Calculation
    const calculateAIR = () => {
        const certBonus = myCertificates.length * 300;
        const accuracyBonus = (quizStats.avgAccuracy || 70) * 12;
        const taskBonus = (metrics.completedTasks || 0) * 80;
        const streakBonus = streak * 75;
        const totalScore = xp + certBonus + accuracyBonus + taskBonus + streakBonus;

        const estRank = Math.max(1, Math.round(500000 / (totalScore + 120)));
        const percentile = Math.min(99.9, Math.max(65.0, ((500000 - estRank) / 500000 * 100))).toFixed(1);

        let tier = 'Competitive Contender';
        if (estRank <= 50) tier = 'National Topper (AIR Top 50)';
        else if (estRank <= 250) tier = 'State Ranker (Top Tier)';
        else if (estRank <= 1000) tier = 'Selection Zone (High Probability)';

        return { rank: estRank, percentile, tier, score: totalScore };
    };

    const userAIR = calculateAIR();

    // WhatsApp Schedule Share
    const handleShareWhatsApp = () => {
        if (!plan) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter(t => {
            const taskDate = t.scheduledDate instanceof Date
                ? t.scheduledDate.toISOString().split('T')[0]
                : String(t.scheduledDate).split('T')[0];
            return taskDate === todayStr;
        });

        const taskListText = todayTasks.length > 0
            ? todayTasks.map(t => `• ${t.topic} (${t.subject}) ${t.isCompleted ? '✅' : '⏳'}`).join('\n')
            : tasks.slice(0, 3).map(t => `• ${t.topic} (${t.subject})`).join('\n');

        const message = `🎯 *My Daily Study Target - ${plan.examName}*\n📅 *Date:* ${todayStr}\n⏳ *Exam Countdown:* ${countdown.days} Days : ${countdown.hours} Hours Remaining\n📊 *Progress:* ${metrics.progressPercentage}% | LVL ${level} Scholar (${xp} XP)\n🏆 *Est. AIR:* #${userAIR.rank} (${userAIR.percentile}%ile)\n🔥 *Study Streak:* ${streak} Days Active\n\n📚 *Today's Modules:*\n${taskListText}\n\n🏛️ *Govt. Accredited Credentials:* ${myCertificates.length} Verified Certificates Earned\n💡 "${currentQuote.text}" - _${currentQuote.author}_\n\n_Tracked with AI Smart Study Planner_`;

        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    };

    // Google Calendar .ics Export
    const handleExportCalendar = () => {
        if (!plan || tasks.length === 0) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter(t => {
            const taskDate = t.scheduledDate instanceof Date
                ? t.scheduledDate.toISOString().split('T')[0]
                : String(t.scheduledDate).split('T')[0];
            return taskDate === todayStr;
        });

        const tasksToExport = todayTasks.length > 0 ? todayTasks : tasks.slice(0, 5);

        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//AI Smart Study Planner//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        tasksToExport.forEach((task, idx) => {
            const now = new Date();
            const start = new Date(now.getTime() + (idx * 60 * 60 * 1000));
            const end = new Date(start.getTime() + ((task.durationMinutes || 45) * 60 * 1000));

            const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

            icsContent.push('BEGIN:VEVENT');
            icsContent.push(`UID:task-${task.id || idx}-${Date.now()}@aistudyplanner.com`);
            icsContent.push(`DTSTAMP:${formatDate(new Date())}`);
            icsContent.push(`DTSTART:${formatDate(start)}`);
            icsContent.push(`DTEND:${formatDate(end)}`);
            icsContent.push(`SUMMARY:📚 Study: ${task.topic} (${task.subject})`);
            icsContent.push(`DESCRIPTION:Target: ${plan.examName} | Goal: Complete topic study and AI active recall booster.`);
            icsContent.push('STATUS:CONFIRMED');
            icsContent.push('END:VEVENT');
        });

        icsContent.push('END:VCALENDAR');

        const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Study_Plan_${plan.examName.replace(/\s+/g, '_')}_${todayStr}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        confetti({ particleCount: 50, spread: 60 });
    };

    const handleOpenClaimModal = (task = null) => {
        setTaskToCertify(task);
        setClaimModalOpen(true);
    };

    // Auth verification
    useEffect(() => {
        if (!token || !user) {
            navigate('/login');
            return;
        }
        fetchCurrentPlan();
        fetchQuizStats();
        fetchMyCertificates();
    }, [token, navigate]);

    // Timer countdown effect
    useEffect(() => {
        let interval = null;
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isTimerRunning) {
            setIsTimerRunning(false);
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            addXp(100);
            logCompletedSession(timerMode);
            alert(`🎉 Amazing focus! You finished a ${timerMode}-min focus session and gained +100 XP!`);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft, timerMode]);

    // Ambient sound handling
    useEffect(() => {
        if (ambientTrack === 'none') {
            stopAmbientSound();
        } else {
            playAmbientSound(ambientTrack, ambientVol);
        }
        return () => stopAmbientSound();
    }, [ambientTrack]);

    const handleVolumeChange = (newVol) => {
        setAmbientVol(newVol);
        setAmbientVolume(newVol);
    };

    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchCurrentPlan = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/current`, getAuthHeaders());
            if (res.data.success && res.data.plan) {
                setPlan(res.data.plan);
                setTasks(res.data.tasks || []);
                setMetrics(res.data.metrics || {});
            } else {
                setPlan(null);
                setTasks([]);
            }
        } catch (err) {
            console.error('Error fetching plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizStats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/quiz-stats`, getAuthHeaders());
            if (res.data.success) {
                setQuizStats({
                    totalQuizzes: res.data.totalQuizzes || 0,
                    avgAccuracy: res.data.avgAccuracy || 0,
                    history: res.data.history || []
                });
            }
        } catch (err) {
            console.error('Error fetching quiz stats:', err);
        }
    };

    const fetchMyCertificates = async () => {
        try {
            const res = await axios.get(`${API_BASE}/my-certificates`, getAuthHeaders());
            if (res.data.success) {
                setMyCertificates(res.data.certificates || []);
            }
        } catch (err) {
            console.error('Error fetching certificates:', err);
        }
    };

    const handleClaimCertificate = async () => {
        if (!currentQuiz) return;
        setIsIssuingCert(true);
        try {
            const res = await axios.post(`${API_BASE}/issue-certificate`, {
                topic: currentQuiz.topic,
                subject: currentQuiz.subject,
                examName: plan?.examName || 'Academic Course',
                score: quizScore,
                accuracyPct: accuracyPct
            }, getAuthHeaders());

            if (res.data.success) {
                confetti({ particleCount: 200, spread: 100 });
                setClaimedCertificate(res.data.certificate);
                fetchMyCertificates();
            }
        } catch (err) {
            console.error('Error claiming certificate:', err);
            alert('Could not claim certificate at this moment.');
        } finally {
            setIsIssuingCert(false);
        }
    };

    const handleLogout = () => {
        stopAmbientSound();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Toggle Task Completion
    const handleToggleTask = async (taskId) => {
        try {
            const res = await axios.patch(`${API_BASE}/task/${taskId}/toggle`, {}, getAuthHeaders());
            if (res.data.success) {
                const updatedTasks = tasks.map(t =>
                    t.id === taskId ? { ...t, isCompleted: res.data.isCompleted } : t
                );
                setTasks(updatedTasks);

                const completed = updatedTasks.filter(t => t.isCompleted).length;
                const total = updatedTasks.length;
                setMetrics(prev => ({
                    ...prev,
                    completedTasks: completed,
                    progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
                }));

                if (res.data.isCompleted) {
                    addXp(50);
                    confetti({
                        particleCount: 80,
                        spread: 60,
                        origin: { y: 0.7 }
                    });
                }
            }
        } catch (err) {
            console.error('Error toggling task:', err);
        }
    };

    // Upload & Extract Syllabus PDF
    const handlePdfUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('syllabusPdf', file);

        try {
            setPdfUploading(true);
            setGenError('');
            const res = await axios.post(`${API_BASE}/extract-pdf`, formData, {
                headers: {
                    ...getAuthHeaders().headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                setSyllabusText(res.data.extractedText || '');
            }
        } catch (err) {
            console.error('PDF Upload Error:', err);
            setGenError('Failed to parse PDF. You can paste topics manually.');
        } finally {
            setPdfUploading(false);
        }
    };

    const handleUsePreset = (name, sampleTopics) => {
        setExamName(name);
        setSyllabusText(sampleTopics);
    };

    // Generate Study Plan
    const handleGeneratePlan = async (e) => {
        e.preventDefault();
        setGenerating(true);
        setGenError('');

        try {
            const res = await axios.post(`${API_BASE}/create`, {
                examName,
                examDate,
                dailyHours,
                syllabusText
            }, getAuthHeaders());

            if (res.data.success) {
                confetti({ particleCount: 150, spread: 90 });
                addXp(100);
                await fetchCurrentPlan();
            }
        } catch (err) {
            console.error('Plan generation failed:', err);
            setGenError(err.response?.data?.message || 'Failed to create plan.');
        } finally {
            setGenerating(false);
        }
    };

    const handleDeletePlan = async () => {
        if (!window.confirm('Are you sure you want to delete this study plan and create a new one?')) return;
        try {
            await axios.delete(`${API_BASE}/plan/${plan.id}`, getAuthHeaders());
            setPlan(null);
            setTasks([]);
        } catch (err) {
            console.error('Error deleting plan:', err);
        }
    };

    // Pomodoro helpers
    const switchTimerMode = (mins) => {
        setIsTimerRunning(false);
        setTimerMode(mins);
        setTimeLeft(mins * 60);
    };

    const resetTimer = () => {
        setIsTimerRunning(false);
        setTimeLeft(timerMode * 60);
    };

    const logCompletedSession = async (mins) => {
        try {
            await axios.post(`${API_BASE}/log-session`, {
                planId: plan?.id || null,
                minutes: mins
            }, getAuthHeaders());
        } catch (err) {
            console.error('Session log failed:', err);
        }
    };

    const formatTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Ask AI Study Coach
    const handleAskCoach = async (customText = null) => {
        const text = customText || coachPrompt;
        if (!text.trim()) return;

        const newHistory = [...coachHistory, { role: 'user', text }];
        setCoachHistory(newHistory);
        setCoachPrompt('');
        setCoachLoading(true);

        try {
            const res = await axios.post(`${API_BASE}/ask-coach`, {
                prompt: text,
                topic: tasks[0]?.topic || plan?.examName,
                subject: tasks[0]?.subject || 'General'
            }, getAuthHeaders());

            if (res.data.success) {
                setCoachHistory([
                    ...newHistory,
                    {
                        role: 'assistant',
                        text: res.data.reply,
                        keyTips: res.data.keyTips,
                        formulaOrRule: res.data.formulaOrRule
                    }
                ]);
            }
        } catch (err) {
            console.error('Coach error:', err);
            setCoachHistory([
                ...newHistory,
                { role: 'assistant', text: 'Sorry, I am temporarily having trouble reaching the knowledge engine.' }
            ]);
        } finally {
            setCoachLoading(false);
        }
    };

    // Launch AI Active Recall Quiz for a topic
    const startTopicQuiz = async (task) => {
        setQuizLoading(true);
        setQuizModalOpen(true);
        setActiveQuizTask(task);
        setQuizStep(0);
        setSelectedOption(null);
        setQuizScore(0);
        setQuizAnswersRecord([]);
        setIsQuizFinished(false);
        setShowReviewDetails(false);

        try {
            const res = await axios.post(`${API_BASE}/generate-quiz`, {
                topic: task.topic,
                subject: task.subject
            }, getAuthHeaders());

            if (res.data.success) {
                setCurrentQuiz(res.data);
            }
        } catch (err) {
            console.error('Quiz generator error:', err);
            alert('Failed to generate quiz for this topic.');
            setQuizModalOpen(false);
        } finally {
            setQuizLoading(false);
        }
    };

    const handleSelectOption = (idx) => {
        if (selectedOption !== null) return;
        setSelectedOption(idx);

        const currentQ = currentQuiz.questions[quizStep];
        const isCorrect = idx === currentQ.answerIndex;
        const newScore = isCorrect ? quizScore + 1 : quizScore;
        if (isCorrect) {
            setQuizScore(newScore);
            addXp(25);
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }

        // Record answer
        setQuizAnswersRecord(prev => [
            ...prev,
            {
                question: currentQ.question,
                options: currentQ.options,
                selectedIdx: idx,
                correctIdx: currentQ.answerIndex,
                isCorrect,
                explanation: currentQ.explanation
            }
        ]);
    };

    const handleNextQuizQuestion = async () => {
        if (quizStep + 1 < currentQuiz.questions.length) {
            setQuizStep(prev => prev + 1);
            setSelectedOption(null);
        } else {
            // Quiz completed -> enter Booster Arena Dashboard!
            setIsQuizFinished(true);
            const total = currentQuiz.questions.length;
            const accuracyPct = Math.round((quizScore / total) * 100);

            if (accuracyPct >= 66) {
                confetti({ particleCount: 160, spread: 90 });
            }
            addXp(50);

            // Log performance to database
            try {
                await axios.post(`${API_BASE}/log-quiz`, {
                    topic: currentQuiz.topic,
                    subject: currentQuiz.subject,
                    totalQuestions: total,
                    score: quizScore,
                    accuracyPct
                }, getAuthHeaders());
                fetchQuizStats();
            } catch (e) {
                console.error('Quiz logging error:', e);
            }
        }
    };

    // Booster Actions
    const handleRetakeBooster = () => {
        setQuizStep(0);
        setSelectedOption(null);
        setQuizScore(0);
        setQuizAnswersRecord([]);
        setIsQuizFinished(false);
        setShowReviewDetails(false);
    };

    const handleAskCoachAboutQuiz = () => {
        setQuizModalOpen(false);
        setIsCoachOpen(true);
        const missed = quizAnswersRecord.filter(a => !a.isCorrect);
        const promptText = missed.length > 0
            ? `I missed this question on ${currentQuiz.topic}: "${missed[0].question}". Can you explain the shortcut and concept simply?`
            : `I just aced the quiz on ${currentQuiz.topic}! Give me advanced tips for this topic in the exam.`;
        handleAskCoach(promptText);
    };

    const handleMarkTopicMasteredAndAdvance = async () => {
        if (activeQuizTask) {
            await handleToggleTask(activeQuizTask.id);
        }
        setQuizModalOpen(false);
    };

    const getSubjectClass = (subject = '') => {
        const s = subject.toLowerCase();
        if (s.includes('math') || s.includes('arithmetic')) return 'badge-math';
        if (s.includes('reasoning') || s.includes('logic')) return 'badge-reasoning';
        if (s.includes('general awareness') || s.includes('current')) return 'badge-general';
        if (s.includes('science')) return 'badge-science';
        return 'badge-other';
    };

    // Filter tasks based on day filter & search query
    const todayStr = new Date().toISOString().split('T')[0];
    const filteredTasks = tasks.filter(task => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matches = task.topic.toLowerCase().includes(q) || task.subject.toLowerCase().includes(q);
            if (!matches) return false;
        }

        if (dayFilter === 'all') return true;
        if (dayFilter === 'today') {
            const taskDate = task.scheduledDate instanceof Date
                ? task.scheduledDate.toISOString().split('T')[0]
                : String(task.scheduledDate).split('T')[0];
            return taskDate === todayStr;
        }
        return task.dayNumber === Number(dayFilter);
    });

    const uniqueDays = Array.from(new Set(tasks.map(t => t.dayNumber))).sort((a, b) => a - b);

    const subjectStats = tasks.reduce((acc, t) => {
        const s = t.subject || 'General';
        if (!acc[s]) acc[s] = { total: 0, completed: 0 };
        acc[s].total += 1;
        if (t.isCompleted) acc[s].completed += 1;
        return acc;
    }, {});

    const readinessScore = Math.min(
        100,
        Math.round((metrics.progressPercentage * 0.7) + (metrics.completedTasks > 0 ? 25 : 5))
    );

    // Dynamic booster tiers based on score
    const totalQ = currentQuiz?.questions?.length || 3;
    const accuracyPct = Math.round((quizScore / totalQ) * 100);

    const getBoosterTier = () => {
        if (accuracyPct === 100) {
            return {
                tier: 'S-Rank',
                rankClass: 's-rank',
                badgeClass: 'badge-s-rank',
                icon: Trophy,
                title: 'UNSTOPPABLE GENIUS! EXAM READY MASTERY!',
                quote: 'Flawless precision! Your mental grasp of this module is in the top 1% percentile. Keep this ferocious momentum going!',
                retention: 'Elite 99% Retention',
                masteryPraise: 'Flawlessly identified high-yield formulas and underlying traps.'
            };
        } else if (accuracyPct >= 66) {
            return {
                tier: 'A-Rank',
                rankClass: 'a-rank',
                badgeClass: 'badge-a-rank',
                icon: Zap,
                title: 'SOLID MOMENTUM! YOU ARE RIGHT AT THE FINISH LINE!',
                quote: 'Phenomenal work! You unlocked the core concepts with ease. Just 1 fine detail to polish to reach 100% mastery!',
                retention: 'Solid 85% Retention',
                masteryPraise: 'Quick comprehension of patterns and core questions.'
            };
        } else {
            return {
                tier: 'Warrior',
                rankClass: 'b-rank',
                badgeClass: 'badge-b-rank',
                icon: Flame,
                title: 'WARRIOR SPIRIT! EVERY MISTAKE FORGES A CHAMPION!',
                quote: 'Never back down! The greatest rankers make mistakes during practice so they never repeat them in the exam hall. Hit Retake Booster and conquer it now!',
                retention: 'Developing Fast',
                masteryPraise: 'Courageous attempt under timed pressure.'
            };
        }
    };

    const boosterInfo = getBoosterTier();

    if (loading) {
        return (
            <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <Sparkles size={40} style={{ animation: 'spin 2s linear infinite', color: '#818cf8', marginBottom: 16 }} />
                    <p>Loading your AI Study Planner...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Fullscreen Zen Focus Mode */}
            {zenMode && (
                <div className="zen-overlay">
                    <button onClick={() => setZenMode(false)} className="zen-close-btn">
                        <Minimize2 size={16} style={{ marginRight: 6 }} /> Exit Zen Mode
                    </button>
                    <div style={{ color: '#818cf8', fontSize: '1.2rem', fontWeight: 600, marginBottom: 12 }}>
                        {timerMode}m Deep Study Session
                    </div>
                    <div className="zen-timer">{formatTimer(timeLeft)}</div>
                    <div style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '400px' }}>
                        Breathe in deeply, maintain continuous single-task focus. Silence distractions.
                    </div>
                    <div className="timer-controls" style={{ marginTop: 30 }}>
                        <button
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className={`timer-btn timer-btn-primary ${isTimerRunning ? 'pause' : ''}`}
                        >
                            {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
                            {isTimerRunning ? 'Pause' : 'Resume Focus'}
                        </button>
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <header className="dash-navbar">
                <div className="dash-brand">
                    <div className="brand-icon-box">
                        <Brain size={24} color="#ffffff" />
                    </div>
                    <div>
                        <h1>AI Smart Study Planner</h1>
                    </div>
                </div>

                <div className="dash-user-section">
                    <div className="gamify-badge">
                        <span className="level-tag">LVL {level}</span>
                        <div className="xp-bar-box">
                            <span className="xp-label">{xpCurrentLevel}/200 XP</span>
                            <div className="xp-bar-mini">
                                <div className="xp-bar-fill" style={{ width: `${(xpCurrentLevel / 200) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="streak-badge" title="3-Day Active Study Streak!">
                        <Flame size={16} />
                        <span>{streak} Days</span>
                    </div>

                    <div 
                        className="air-badge-box" 
                        onClick={() => setActiveTab('leaderboard')} 
                        title="View All-India Mock Rank & Trophy Badges"
                    >
                        <Crown size={15} color="#fbbf24" />
                        <span className="air-badge-num">AIR #{userAIR.rank}</span>
                        <span className="air-badge-sub">({userAIR.percentile}%ile)</span>
                    </div>

                    <button onClick={() => setIsCoachOpen(true)} className="coach-launcher-btn">
                        <Sparkles size={16} />
                        <span>Ask AI Coach</span>
                    </button>

                    <button onClick={handleLogout} className="logout-btn" title="Sign out">
                        <LogOut size={16} />
                        <span>Log Out</span>
                    </button>
                </div>
            </header>

            <main className="dash-content">
                {!plan ? (
                    /* Plan Generator Wizard */
                    <div className="generator-card">
                        <div className="generator-header">
                            <h2>Generate Your Smart Study Plan</h2>
                            <p>Configure your target exam, timeframe, and syllabus. AI will synthesize an optimized daily study schedule.</p>
                        </div>

                        {genError && (
                            <div className="alert alert-error" style={{ marginBottom: 20 }}>
                                <AlertCircle size={18} />
                                <span>{genError}</span>
                            </div>
                        )}

                        <form onSubmit={handleGeneratePlan}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Quick Exam Presets
                                </label>
                                <div className="presets-row">
                                    <button
                                        type="button"
                                        className={`preset-chip ${examName === 'RRB NTPC' ? 'active' : ''}`}
                                        onClick={() => handleUsePreset('RRB NTPC', 'Mathematics: Number System, Decimals, Fractions, LCM, HCF, Ratio, Percentages, Mensuration, Time & Work, Time & Distance, SI & CI, Profit & Loss, Algebra, Geometry, Trigonometry, Elementary Statistics\nGeneral Intelligence & Reasoning: Analogies, Completion of Number & Alphabetical Series, Coding & Decoding, Mathematical Operations, Similarities & Differences, Relationships, Analytical Reasoning, Syllogism, Jumbling, Venn Diagrams, Puzzle, Data Sufficiency\nGeneral Awareness: Current Events, Indian Literature, Monuments & Places, General Science & Life Science, Indian History & Freedom Struggle, Physical Geography, Indian Polity & Constitution')}
                                    >
                                        🚆 RRB NTPC
                                    </button>
                                    <button
                                        type="button"
                                        className={`preset-chip ${examName === 'SSC CGL' ? 'active' : ''}`}
                                        onClick={() => handleUsePreset('SSC CGL', 'Quantitative Aptitude, General Intelligence and Reasoning, English Comprehension, General Awareness & Current Affairs')}
                                    >
                                        🏛️ SSC CGL
                                    </button>
                                    <button
                                        type="button"
                                        className={`preset-chip ${examName === 'UPSC Prelims' ? 'active' : ''}`}
                                        onClick={() => handleUsePreset('UPSC Prelims', 'Indian Polity & Governance, Modern Indian History, Indian & World Geography, General Science & Tech, Environment & Ecology, CSAT Reasoning & Reading')}
                                    >
                                        📚 UPSC Prelims
                                    </button>
                                    <button
                                        type="button"
                                        className={`preset-chip ${examName === 'Semester Exam' ? 'active' : ''}`}
                                        onClick={() => handleUsePreset('College Semester Exam', 'Unit 1: Fundamentals & Theory, Unit 2: Core Architecture & Algorithms, Unit 3: Implementation & Case Studies, Unit 4: Advanced Topics & Review')}
                                    >
                                        🎓 Semester Exam
                                    </button>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Exam / Goal Name</label>
                                    <input
                                        type="text"
                                        value={examName}
                                        onChange={(e) => setExamName(e.target.value)}
                                        placeholder="e.g. RRB NTPC / Semester Exam"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Target Exam Date</label>
                                    <input
                                        type="date"
                                        value={examDate}
                                        onChange={(e) => setExamDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label>Daily Study Commitment</label>
                                    <span style={{ color: '#818cf8', fontWeight: 700 }}>{dailyHours} hours / day</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="8"
                                    step="0.5"
                                    value={dailyHours}
                                    onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                                    style={{ accentColor: '#6366f1', marginTop: 8 }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Upload Syllabus PDF (Optional)</label>
                                <label className="upload-zone">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handlePdfUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <Upload size={28} color="#818cf8" style={{ margin: '0 auto 8px' }} />
                                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>
                                        {pdfUploading ? 'Extracting topics from PDF...' : 'Click to upload Syllabus PDF'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
                                        Supports RRB NTPC syllabus or any official exam PDF
                                    </div>
                                </label>
                            </div>

                            <div className="form-group">
                                <label>Syllabus Topics (Editable)</label>
                                <textarea
                                    value={syllabusText}
                                    onChange={(e) => setSyllabusText(e.target.value)}
                                    placeholder="Enter or paste subjects and topics here..."
                                    rows={5}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '10px',
                                        color: '#ffffff',
                                        padding: '12px 16px',
                                        fontFamily: 'inherit',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="gen-submit-btn"
                                disabled={generating || pdfUploading}
                            >
                                <Sparkles size={20} />
                                {generating ? 'Generating Intelligent Study Plan...' : 'Generate AI Study Schedule'}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Active Study Dashboard */
                    <>
                        {/* Strategic AI Readiness Banner */}
                        <div className="readiness-banner">
                            <div className="readiness-left">
                                <div className="readiness-icon">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <div className="readiness-title">AI Exam Readiness Predictor</div>
                                    <div className="readiness-sub">
                                        Based on {metrics.completedTasks} completed modules, your estimated retention & coverage probability:
                                    </div>
                                </div>
                            </div>
                            <div className="readiness-score-box">
                                <span className="score-num">{readinessScore}%</span>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Readiness</span>
                            </div>
                        </div>

                        {/* Plan Hero Banner */}
                        <div className="plan-hero-card">
                            <div className="plan-info">
                                <h2>{plan.title || `${plan.examName} Study Plan`}</h2>
                                <div className="plan-meta">
                                    <span className="meta-pill">
                                        <Calendar size={14} />
                                        Target: {new Date(plan.examDate).toLocaleDateString()}
                                    </span>
                                    <span className="meta-pill">
                                        <Clock size={14} />
                                        {plan.dailyHours} hrs / day
                                    </span>
                                    <span className="meta-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                                        <Layers size={14} />
                                        {plan.totalDays} Total Days
                                    </span>
                                </div>

                                {/* Live Countdown Ticker Widget */}
                                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        ⏳ Live Exam Countdown:
                                    </span>
                                    <div className="countdown-widget-container">
                                        <div className="countdown-unit-box">
                                            <span className="countdown-digit">{String(countdown.days).padStart(2, '0')}</span>
                                            <span className="countdown-sub">Days</span>
                                        </div>
                                        <span className="countdown-sep">:</span>
                                        <div className="countdown-unit-box">
                                            <span className="countdown-digit">{String(countdown.hours).padStart(2, '0')}</span>
                                            <span className="countdown-sub">Hours</span>
                                        </div>
                                        <span className="countdown-sep">:</span>
                                        <div className="countdown-unit-box">
                                            <span className="countdown-digit">{String(countdown.minutes).padStart(2, '0')}</span>
                                            <span className="countdown-sub">Mins</span>
                                        </div>
                                        <span className="countdown-sep">:</span>
                                        <div className="countdown-unit-box">
                                            <span className="countdown-digit" style={{ color: '#fbbf24' }}>{String(countdown.seconds).padStart(2, '0')}</span>
                                            <span className="countdown-sub">Secs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="plan-hero-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                <button
                                    onClick={handleShareWhatsApp}
                                    className="btn-whatsapp"
                                    title="Share today's study target to WhatsApp"
                                >
                                    <MessageCircle size={16} />
                                    <span>Share to WhatsApp</span>
                                </button>

                                <button
                                    onClick={handleExportCalendar}
                                    className="btn-gcal"
                                    title="Export schedule as .ics for Google Calendar"
                                >
                                    <Calendar size={16} />
                                    <span>Add to Calendar (.ics)</span>
                                </button>

                                <button onClick={handleDeletePlan} className="logout-btn" style={{ padding: '9px 14px' }} title="Reset or Delete plan">
                                    <Trash2 size={16} />
                                    <span>Reset</span>
                                </button>
                            </div>
                        </div>

                        {/* Ranker Motivation Quote Box */}
                        <div className="quote-banner">
                            <div className="quote-left">
                                <Sparkles size={22} color="#fbbf24" style={{ flexShrink: 0 }} />
                                <div>
                                    <div className="quote-text">"{currentQuote.text}"</div>
                                    <span className="quote-author">— {currentQuote.author}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setQuoteIdx((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
                                className="quote-shuffle-btn"
                                title="Shuffle another motivation quote"
                            >
                                <RefreshCw size={13} />
                                <span>Next Quote</span>
                            </button>
                        </div>

                        {/* Top Metrics Grid */}
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                                    <Award size={26} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="metric-label">Overall Progress</div>
                                    <div className="metric-value">{metrics.progressPercentage}%</div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: `${metrics.progressPercentage}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="metric-card">
                                <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                                    <CheckSquare size={26} />
                                </div>
                                <div>
                                    <div className="metric-label">Completed Tasks</div>
                                    <div className="metric-value">{metrics.completedTasks} / {metrics.totalTasks}</div>
                                    <div className="metric-sub">{metrics.remainingTasks || (metrics.totalTasks - metrics.completedTasks)} tasks remaining</div>
                                </div>
                            </div>

                            <div className="metric-card">
                                <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                                    <Flame size={26} />
                                </div>
                                <div>
                                    <div className="metric-label">Today's Focus</div>
                                    <div className="metric-value">{metrics.todaysTasksCount || 0} Topics</div>
                                    <div className="metric-sub">{metrics.todaysCompletedCount || 0} completed today</div>
                                </div>
                            </div>

                            <div className="metric-card">
                                <div className="metric-icon-box" style={{ background: 'rgba(217, 70, 239, 0.15)', color: '#e879f9' }}>
                                    <Trophy size={26} />
                                </div>
                                <div>
                                    <div className="metric-label">Scholar XP</div>
                                    <div className="metric-value">{xp} XP</div>
                                    <div className="metric-sub">Rank: Level {level} Conqueror</div>
                                </div>
                            </div>
                        </div>

                        {/* Government Authorized Credential Desk Banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.14) 0%, rgba(13, 18, 31, 0.92) 50%, rgba(16, 185, 129, 0.12) 100%)',
                            border: '1px solid rgba(212, 175, 55, 0.38)',
                            borderRadius: 16,
                            padding: '16px 22px',
                            marginBottom: 24,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 16,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, #d4af37 0%, #b45309 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 18px rgba(212, 175, 55, 0.45)'
                                }}>
                                    <Award size={26} color="#ffffff" />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.02rem', color: '#ffffff' }}>
                                            Government Authorized Academic Credential Portal
                                        </span>
                                        <span className="cert-gov-badge">
                                            <ShieldCheck size={12} />
                                            GOVT. RECOGNIZED • ISO 9001:2015
                                        </span>
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 2 }}>
                                        National Academic Evaluation Council • <strong style={{ color: '#fef08a' }}>{myCertificates.length}</strong> official credentials claimed & verifiable.
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => handleOpenClaimModal()}
                                    className="claim-btn-submit"
                                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                >
                                    <Award size={15} />
                                    <span>Claim Official Certificate 📜</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('certificates')}
                                    className="claim-btn-cancel"
                                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                                >
                                    <span>View My Certificates ({myCertificates.length})</span>
                                </button>
                            </div>
                        </div>

                        {/* Tabs Bar & View Switcher */}
                        <div className="tabs-container">
                            <div className="tabs-left">
                                <button
                                    className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('schedule')}
                                >
                                    <Calendar size={18} />
                                    Study Schedule ({tasks.length})
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('certificates')}
                                    style={activeTab === 'certificates' ? { borderColor: 'rgba(212, 175, 55, 0.6)', color: '#fef08a' } : {}}
                                >
                                    <Award size={18} color="#d4af37" />
                                    Government Certificates ({myCertificates.length})
                                    <span className="tab-gov-pill">GOVT AUTH</span>
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'pomodoro' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('pomodoro')}
                                >
                                    <Timer size={18} />
                                    Pomodoro & Ambient Studio
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'arena' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('arena')}
                                >
                                    <Zap size={18} />
                                    Quiz Arena & Performance ({quizStats.totalQuizzes})
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('analytics')}
                                >
                                    <BarChart2 size={18} />
                                    Syllabus Mastery
                                </button>
                            </div>

                            {activeTab === 'schedule' && (
                                <div className="view-mode-toggles">
                                    <button
                                        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List size={16} />
                                        List
                                    </button>
                                    <button
                                        className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                                        onClick={() => setViewMode('kanban')}
                                    >
                                        <Columns size={16} />
                                        Kanban
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* TAB 1: Study Schedule */}
                        {activeTab === 'schedule' && (
                            <div>
                                <div className="schedule-controls">
                                    <div className="filter-pills">
                                        <button
                                            className={`filter-pill ${dayFilter === 'all' ? 'active' : ''}`}
                                            onClick={() => setDayFilter('all')}
                                        >
                                            All Days ({tasks.length})
                                        </button>
                                        <button
                                            className={`filter-pill ${dayFilter === 'today' ? 'active' : ''}`}
                                            onClick={() => setDayFilter('today')}
                                        >
                                            Today ({metrics.todaysTasksCount || 0})
                                        </button>
                                        {uniqueDays.slice(0, 12).map(d => (
                                            <button
                                                key={d}
                                                className={`filter-pill ${dayFilter === d ? 'active' : ''}`}
                                                onClick={() => setDayFilter(d)}
                                            >
                                                Day {d}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="search-box">
                                        <Search size={15} color="#94a3b8" />
                                        <input
                                            type="text"
                                            placeholder="Search topics..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {filteredTasks.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
                                        <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>No study tasks found matching the criteria.</p>
                                    </div>
                                ) : viewMode === 'list' ? (
                                    /* List View */
                                    <div className="task-list">
                                        {filteredTasks.map(task => (
                                            <div
                                                key={task.id}
                                                className={`task-card ${task.isCompleted ? 'completed' : ''}`}
                                            >
                                                <div className="task-left">
                                                    <button
                                                        onClick={() => handleToggleTask(task.id)}
                                                        className={`task-checkbox-btn ${task.isCompleted ? 'checked' : ''}`}
                                                        title={task.isCompleted ? 'Mark incomplete' : 'Mark completed (+50 XP)'}
                                                    >
                                                        {task.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                                    </button>
                                                    <div className="task-content">
                                                        <div className="task-topic">{task.topic}</div>
                                                        <div className="task-badges">
                                                            <span className={`badge-subject ${getSubjectClass(task.subject)}`}>
                                                                {task.subject}
                                                            </span>
                                                            <span className={`badge-difficulty diff-${(task.difficulty || 'medium').toLowerCase()}`}>
                                                                {task.difficulty || 'Medium'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="task-right">
                                                    {/* Dedicated Government Certificate Column / Action */}
                                                    {(() => {
                                                        const existingCert = myCertificates.find(c => 
                                                            (c.topic && task.topic && c.topic.trim().toLowerCase() === task.topic.trim().toLowerCase()) ||
                                                            (c.title && task.topic && c.title.toLowerCase().includes(task.topic.toLowerCase()))
                                                        );
                                                        if (existingCert) {
                                                            return (
                                                                <button
                                                                    onClick={() => setClaimedCertificate(existingCert)}
                                                                    className="task-cert-btn claimed"
                                                                    title="View Official Government Authorized Certificate"
                                                                >
                                                                    <Award size={14} />
                                                                    <span>Govt Certified 🏛️</span>
                                                                </button>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                onClick={() => handleOpenClaimModal(task)}
                                                                className="task-cert-btn claim"
                                                                title="Claim Government Authorized Topic Mastery Certificate"
                                                            >
                                                                <ShieldCheck size={14} />
                                                                <span>Claim Cert 📜</span>
                                                            </button>
                                                        );
                                                    })()}

                                                    {/* AI Quiz Button */}
                                                    <button
                                                        onClick={() => startTopicQuiz(task)}
                                                        className="quiz-action-btn"
                                                        title="Active Recall Quiz on this topic"
                                                    >
                                                        <Sparkles size={14} />
                                                        <span>AI Quiz</span>
                                                    </button>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Clock size={15} />
                                                        <span>{task.durationMinutes}m</span>
                                                    </div>
                                                    <span className="day-badge">Day {task.dayNumber}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Kanban Board View */
                                    <div className="kanban-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                                        <div className="kanban-col">
                                            <div className="kanban-col-header">
                                                <span>To Study</span>
                                                <span className="col-count">{filteredTasks.filter(t => !t.isCompleted).length}</span>
                                            </div>
                                            {filteredTasks.filter(t => !t.isCompleted).map(t => (
                                                <div key={t.id} className="task-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 14 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>{t.topic}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                        <span className={`badge-subject ${getSubjectClass(t.subject)}`}>{t.subject}</span>
                                                        <button
                                                            onClick={() => handleToggleTask(t.id)}
                                                            className="quiz-action-btn"
                                                            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                                        >
                                                            Mark Done
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="kanban-col">
                                            <div className="kanban-col-header">
                                                <span>Today's Target</span>
                                                <span className="col-count">{metrics.todaysTasksCount || 0}</span>
                                            </div>
                                            {filteredTasks.slice(0, 3).map(t => (
                                                <div key={t.id} className="task-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 14, borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>{t.topic}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                        <span className={`badge-difficulty diff-${(t.difficulty || 'medium').toLowerCase()}`}>{t.difficulty || 'Medium'}</span>
                                                        <button onClick={() => startTopicQuiz(t)} className="quiz-action-btn">
                                                            <Sparkles size={13} /> Quiz
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="kanban-col">
                                            <div className="kanban-col-header">
                                                <span>Mastered</span>
                                                <span className="col-count">{filteredTasks.filter(t => t.isCompleted).length}</span>
                                            </div>
                                            {filteredTasks.filter(t => t.isCompleted).map(t => {
                                                const isCert = myCertificates.some(c => 
                                                    (c.topic && t.topic && c.topic.trim().toLowerCase() === t.topic.trim().toLowerCase()) ||
                                                    (c.title && t.topic && c.title.toLowerCase().includes(t.topic.toLowerCase()))
                                                );
                                                return (
                                                    <div key={t.id} className="task-card completed" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 14 }}>
                                                        <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.95rem', marginBottom: 6 }}>{t.topic}</div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                                            <span className="badge-subject badge-science">Completed</span>
                                                            {isCert ? (
                                                                <button
                                                                    onClick={() => {
                                                                        const cert = myCertificates.find(c => (c.topic && t.topic && c.topic.trim().toLowerCase() === t.topic.trim().toLowerCase()) || (c.title && t.topic && c.title.toLowerCase().includes(t.topic.toLowerCase())));
                                                                        setClaimedCertificate(cert);
                                                                    }}
                                                                    className="task-cert-btn claimed"
                                                                    style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                                                                >
                                                                    🏛️ Certified
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleOpenClaimModal(t)}
                                                                    className="task-cert-btn claim"
                                                                    style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                                                                >
                                                                    📜 Claim Cert
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Column 4: Government Certified */}
                                        <div className="kanban-col certified">
                                            <div className="kanban-col-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Award size={15} color="#d4af37" />
                                                    <span>Govt. Certified</span>
                                                </div>
                                                <span className="col-count" style={{ background: 'rgba(212, 175, 55, 0.25)', color: '#fef08a', borderColor: 'rgba(212, 175, 55, 0.4)' }}>
                                                    {myCertificates.length}
                                                </span>
                                            </div>
                                            {myCertificates.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '28px 12px', color: '#94a3b8', fontSize: '0.82rem' }}>
                                                    <Award size={32} color="#d4af37" style={{ opacity: 0.35, marginBottom: 8 }} />
                                                    <p style={{ margin: '0 0 10px 0' }}>No credentials claimed yet.</p>
                                                    <button
                                                        onClick={() => handleOpenClaimModal()}
                                                        className="task-cert-btn claim"
                                                    >
                                                        Claim First Credential 📜
                                                    </button>
                                                </div>
                                            ) : (
                                                myCertificates.map(c => (
                                                    <div key={c.id || c.certId} className="task-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 12, borderColor: 'rgba(212, 175, 55, 0.35)', background: 'rgba(212, 175, 55, 0.04)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                                                            <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                                                🏛️ GOVT. ACCREDITED
                                                            </span>
                                                            <span style={{ fontSize: '0.68rem', color: '#fef08a', fontFamily: 'monospace' }}>
                                                                {c.certId}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f8fafc', marginBottom: 2 }}>
                                                            {c.title}
                                                        </div>
                                                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: 8 }}>
                                                            {c.subject} • <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{c.grade}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setClaimedCertificate(c)}
                                                            className="task-cert-btn claimed"
                                                            style={{ width: '100%', justifyContent: 'center', padding: '6px 10px', fontSize: '0.75rem' }}
                                                        >
                                                            <Award size={13} />
                                                            <span>View / Print PDF</span>
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: Pomodoro & Ambient Studio */}
                        {activeTab === 'pomodoro' && (
                            <div className="pomodoro-card">
                                <h3>Focus Pomodoro & Ambient Soundscape</h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                                    Deep work intervals with neuro-acoustic focus frequencies.
                                </p>

                                <div className="timer-modes">
                                    <button
                                        className={`mode-btn ${timerMode === 25 ? 'active' : ''}`}
                                        onClick={() => switchTimerMode(25)}
                                    >
                                        25m Focus
                                    </button>
                                    <button
                                        className={`mode-btn ${timerMode === 50 ? 'active' : ''}`}
                                        onClick={() => switchTimerMode(50)}
                                    >
                                        50m Deep Work
                                    </button>
                                    <button
                                        className={`mode-btn ${timerMode === 5 ? 'active' : ''}`}
                                        onClick={() => switchTimerMode(5)}
                                    >
                                        5m Short Break
                                    </button>
                                </div>

                                <div className="timer-display">
                                    {formatTimer(timeLeft)}
                                </div>

                                <div className="timer-controls">
                                    <button
                                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                                        className={`timer-btn timer-btn-primary ${isTimerRunning ? 'pause' : ''}`}
                                    >
                                        {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
                                        {isTimerRunning ? 'Pause' : 'Start Focus'}
                                    </button>

                                    <button onClick={resetTimer} className="timer-btn timer-btn-secondary">
                                        <RotateCcw size={18} />
                                        Reset
                                    </button>

                                    <button onClick={() => setZenMode(true)} className="timer-btn timer-btn-secondary" title="Zen Fullscreen">
                                        <Maximize2 size={18} />
                                        Zen Mode
                                    </button>
                                </div>

                                <div className="ambient-studio">
                                    <div className="ambient-title">🎧 Procedural Ambient Focus Tracks</div>
                                    <div className="ambient-options">
                                        <button
                                            className={`ambient-chip ${ambientTrack === 'none' ? 'active' : ''}`}
                                            onClick={() => setAmbientTrack('none')}
                                        >
                                            <VolumeX size={14} /> Silent
                                        </button>
                                        <button
                                            className={`ambient-chip ${ambientTrack === 'binaural' ? 'active' : ''}`}
                                            onClick={() => setAmbientTrack('binaural')}
                                        >
                                            🧠 40Hz Gamma Waves
                                        </button>
                                        <button
                                            className={`ambient-chip ${ambientTrack === 'rain' ? 'active' : ''}`}
                                            onClick={() => setAmbientTrack('rain')}
                                        >
                                            🌧️ Cozy Rain Noise
                                        </button>
                                        <button
                                            className={`ambient-chip ${ambientTrack === 'zen' ? 'active' : ''}`}
                                            onClick={() => setAmbientTrack('zen')}
                                        >
                                            🌌 Zen Space Drone
                                        </button>
                                    </div>

                                    {ambientTrack !== 'none' && (
                                        <div className="ambient-volume-row">
                                            <Volume2 size={16} />
                                            <input
                                                type="range"
                                                min="0.05"
                                                max="1"
                                                step="0.05"
                                                value={ambientVol}
                                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                                style={{ accentColor: '#6366f1', width: '120px' }}
                                            />
                                            <span>{Math.round(ambientVol * 100)}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: Quiz Arena & Performance Hub */}
                        {activeTab === 'arena' && (
                            <div style={{ maxWidth: '950px', margin: '0 auto' }}>
                                <div className="plan-hero-card" style={{ marginBottom: 24 }}>
                                    <div className="plan-info">
                                        <h2>Quiz Arena & Recall Battleground</h2>
                                        <p style={{ color: '#94a3b8', margin: 0 }}>
                                            Active recall testing is proven to boost long-term exam retention by over 70%.
                                        </p>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => {
                                                const randomTask = tasks[Math.floor(Math.random() * tasks.length)] || { topic: 'General Aptitude', subject: 'Mathematics' };
                                                startTopicQuiz(randomTask);
                                            }}
                                            className="gen-submit-btn"
                                            style={{ margin: 0, padding: '12px 22px', width: 'auto' }}
                                        >
                                            <Zap size={18} />
                                            Launch Random Drill
                                        </button>
                                    </div>
                                </div>

                                <div className="metrics-grid" style={{ marginBottom: 24 }}>
                                    <div className="metric-card">
                                        <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                                            <Trophy size={26} />
                                        </div>
                                        <div>
                                            <div className="metric-label">Total Quizzes Taken</div>
                                            <div className="metric-value">{quizStats.totalQuizzes} Tests</div>
                                            <div className="metric-sub">Across syllabus subjects</div>
                                        </div>
                                    </div>

                                    <div className="metric-card">
                                        <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                                            <TrendingUp size={26} />
                                        </div>
                                        <div>
                                            <div className="metric-label">Average Accuracy</div>
                                            <div className="metric-value">{quizStats.avgAccuracy}%</div>
                                            <div className="metric-sub">{quizStats.avgAccuracy >= 70 ? 'High Retention Zone' : 'Room for Mastery'}</div>
                                        </div>
                                    </div>

                                    <div className="metric-card">
                                        <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                                            <Award size={26} />
                                        </div>
                                        <div>
                                            <div className="metric-label">Recall Master Rank</div>
                                            <div className="metric-value">{quizStats.avgAccuracy >= 80 ? 'Elite S-Tier' : 'Active Challenger'}</div>
                                            <div className="metric-sub">Updated dynamically</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Drill Logs */}
                                <div className="generator-card" style={{ maxWidth: '100%', padding: 28 }}>
                                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#ffffff' }}>Recent Quiz Performance History</h3>
                                    {quizStats.history.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                                            <Zap size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                                            <p>No quizzes logged yet. Click "AI Quiz" on any study task to take your first test!</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {quizStats.history.map(item => (
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        background: 'rgba(255, 255, 255, 0.03)',
                                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                                        borderRadius: 12,
                                                        padding: '14px 18px'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.topic}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>{item.subject}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                                                            {item.score} / {item.totalQuestions} Correct
                                                        </span>
                                                        <span
                                                            style={{
                                                                padding: '4px 10px',
                                                                borderRadius: 12,
                                                                fontSize: '0.85rem',
                                                                fontWeight: 700,
                                                                background: item.accuracyPct >= 70 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                                color: item.accuracyPct >= 70 ? '#34d399' : '#fbbf24'
                                                            }}
                                                        >
                                                            {item.accuracyPct}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Earned Academic Certificates Gallery */}
                                <div className="generator-card" style={{ maxWidth: '100%', padding: 28, marginTop: 24, border: '1px solid rgba(212, 175, 55, 0.4)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fef08a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Award size={22} color="#d4af37" />
                                                    Government Recognized Academic Credentials ({myCertificates.length})
                                                </h3>
                                                <span className="cert-gov-badge">
                                                    <ShieldCheck size={14} />
                                                    GOVERNMENT AUTHORIZED • ISO 9001:2015
                                                </span>
                                            </div>
                                            <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                Officially accredited academic certificates issued under the National Academic & Skill Assessment Framework.
                                            </p>
                                        </div>

                                        {myCertificates.length > 0 && (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => setCertViewMode('table')}
                                                    className={`view-toggle-btn ${certViewMode === 'table' ? 'active' : ''}`}
                                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                >
                                                    <List size={14} />
                                                    <span>Table View</span>
                                                </button>
                                                <button
                                                    onClick={() => setCertViewMode('cards')}
                                                    className={`view-toggle-btn ${certViewMode === 'cards' ? 'active' : ''}`}
                                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                >
                                                    <Columns size={14} />
                                                    <span>Card View</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {myCertificates.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
                                            <Award size={44} color="#d4af37" style={{ opacity: 0.35, marginBottom: 10 }} />
                                            <p style={{ fontSize: '0.95rem', margin: '0 0 4px 0' }}>Score 66% or higher on any AI Quiz to earn your first official verifiable certificate!</p>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Credentials are issued by the National Academic Evaluation Council with unique verifiable cryptographic ID.</span>
                                        </div>
                                    ) : certViewMode === 'table' ? (
                                        /* TABLE VIEW WITH DEDICATED GOVERNMENT AUTHORIZED COLUMN */
                                        <div className="cert-table-container">
                                            <table className="cert-table">
                                                <thead>
                                                    <tr>
                                                        <th>Credential ID</th>
                                                        <th>Candidate & Topic</th>
                                                        <th>Subject / Curriculum</th>
                                                        <th>Grade / Score</th>
                                                        <th style={{ color: '#6ee7b7' }}>🏛️ Authorized By (Govt. Body)</th>
                                                        <th>Issued Date</th>
                                                        <th style={{ textAlign: 'center' }}>Official Credential</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {myCertificates.map(c => {
                                                        const dateStr = new Date(c.issuedAt || Date.now()).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        });
                                                        return (
                                                            <tr key={c.id}>
                                                                <td>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fef08a', fontSize: '0.8rem' }}>
                                                                            {c.certId}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>
                                                                        {c.title}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                                                                        Candidate: <span style={{ color: '#cbd5e1' }}>{c.studentName || user?.username}</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ color: '#cbd5e1', fontWeight: 500 }}>{c.subject}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>{c.examName || 'Competitive Examination'}</div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                        {c.grade || 'Distinction'}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                        {c.accuracyPct}% Accuracy
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                                        <div style={{ fontWeight: 700, color: '#fef08a', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                            <span>🏛️</span>
                                                                            <span>{c.issuingAuthority || 'National Academic Evaluation & Skill Council'}</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                                            <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
                                                                                ✓ Govt. Authorized
                                                                            </span>
                                                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                                                {c.accreditationNo || 'GOV-ACCRED-2026-8834'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                                    {dateStr}
                                                                </td>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <button
                                                                        onClick={() => setClaimedCertificate(c)}
                                                                        className="quiz-action-btn"
                                                                        style={{
                                                                            background: 'rgba(212, 175, 55, 0.15)',
                                                                            color: '#fef08a',
                                                                            borderColor: 'rgba(212, 175, 55, 0.35)',
                                                                            padding: '6px 12px',
                                                                            fontSize: '0.78rem',
                                                                            margin: '0 auto'
                                                                        }}
                                                                    >
                                                                        <Award size={14} />
                                                                        <span>View / Print</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        /* CARD VIEW */
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                                            {myCertificates.map(c => (
                                                <div
                                                    key={c.id}
                                                    style={{
                                                        background: 'linear-gradient(135deg, rgba(13, 18, 31, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%)',
                                                        border: '1px solid rgba(212, 175, 55, 0.35)',
                                                        borderRadius: 14,
                                                        padding: 18,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        gap: 14,
                                                        position: 'relative',
                                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                                                🏛️ GOVT. RECOGNIZED CREDENTIAL
                                                            </span>
                                                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>{c.certId}</span>
                                                        </div>
                                                        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.02rem', marginBottom: 4 }}>{c.title}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>{c.subject} • {c.grade}</div>

                                                        {/* Government Authorized Column / Field */}
                                                        <div style={{ background: 'rgba(212, 175, 55, 0.06)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 8, padding: '8px 12px', fontSize: '0.76rem', color: '#cbd5e1' }}>
                                                            <div style={{ color: '#fef08a', fontWeight: 700, marginBottom: 2 }}>
                                                                🏛️ {c.issuingAuthority || 'National Academic Evaluation & Skill Council'}
                                                            </div>
                                                            <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                                                Accredited: <span style={{ color: '#6ee7b7', fontFamily: 'monospace' }}>{c.accreditationNo || 'GOV-ACCRED-2026-8834'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setClaimedCertificate(c)}
                                                        className="quiz-action-btn"
                                                        style={{
                                                            background: 'rgba(212, 175, 55, 0.15)',
                                                            color: '#fef08a',
                                                            borderColor: 'rgba(212, 175, 55, 0.35)',
                                                            justifyContent: 'center',
                                                            padding: '9px 14px'
                                                        }}
                                                    >
                                                        <Award size={15} />
                                                        <span>View / Print Certificate</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 4: Syllabus Mastery */}
                        {activeTab === 'analytics' && (
                            <div className="generator-card" style={{ maxWidth: '900px' }}>
                                <div className="generator-header" style={{ textAlign: 'left', marginBottom: 24 }}>
                                    <h2>Syllabus Coverage by Subject</h2>
                                    <p>Track your topic mastery and coverage across all study subjects.</p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    {Object.entries(subjectStats).map(([sub, stat]) => {
                                        const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                                        return (
                                            <div
                                                key={sub}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                                    borderRadius: 14,
                                                    padding: '18px 22px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{sub}</span>
                                                    <span style={{ color: '#818cf8', fontWeight: 600 }}>{stat.completed} / {stat.total} Topics ({pct}%)</span>
                                                </div>
                                                <div className="progress-bar-bg" style={{ marginTop: 0 }}>
                                                    <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAB 5: Government Recognized Academic Credentials Portal */}
                        {activeTab === 'certificates' && (
                            <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                                {/* Official Government Accreditation Header Banner */}
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(13, 18, 31, 0.95) 50%, rgba(16, 185, 129, 0.12) 100%)',
                                    border: '1px solid rgba(212, 175, 55, 0.45)',
                                    borderRadius: 18,
                                    overflow: 'hidden',
                                    marginBottom: 24,
                                    boxShadow: '0 8px 35px rgba(0,0,0,0.45)'
                                }}>
                                    <div className="govt-tricolor-bar"></div>
                                    <div style={{ padding: '26px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                                            <div style={{
                                                width: 58,
                                                height: 58,
                                                borderRadius: 14,
                                                background: 'linear-gradient(135deg, #d4af37 0%, #b45309 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 0 25px rgba(212, 175, 55, 0.5)'
                                            }}>
                                                <Award size={32} color="#ffffff" />
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.72rem', color: '#fef08a', fontWeight: 800, background: 'rgba(212, 175, 55, 0.2)', padding: '2px 10px', borderRadius: 12, border: '1px solid rgba(212, 175, 55, 0.4)', letterSpacing: 1 }}>
                                                        🏛️ GOVERNMENT OF INDIA RECOGNIZED ACCREDITATION
                                                    </span>
                                                    <span style={{ fontSize: '0.72rem', color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                                        ISO 9001:2015 CERTIFIED
                                                    </span>
                                                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: 12 }}>
                                                        NSQF LEVEL-7 ALIGNED
                                                    </span>
                                                </div>
                                                <h2 style={{ margin: '8px 0 4px', fontSize: '1.5rem', color: '#ffffff' }}>
                                                    National Academic Evaluation & Skill Accreditation Portal
                                                </h2>
                                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>
                                                    Official Government-authorized credential registry. Claim official certificates for any studied topic, view tamper-proof verification, and print high-resolution credentials.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenClaimModal()}
                                            className="claim-btn-submit"
                                            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
                                        >
                                            <ShieldCheck size={20} />
                                            <span>Claim New Government Certificate</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Spec Cards Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
                                    <div className="metric-card" style={{ padding: 18 }}>
                                        <div className="metric-icon-box" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#fef08a' }}>
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <div className="metric-label">Accredited Credentials</div>
                                            <div className="metric-value">{myCertificates.length} Issued</div>
                                            <div className="metric-sub">Central Registry Verified</div>
                                        </div>
                                    </div>

                                    <div className="metric-card" style={{ padding: 18 }}>
                                        <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <div className="metric-label">Governing Council</div>
                                            <div className="metric-value" style={{ fontSize: '1.05rem', color: '#6ee7b7' }}>NAESC India</div>
                                            <div className="metric-sub">Govt. of India Recognized</div>
                                        </div>
                                    </div>

                                    <div className="metric-card" style={{ padding: 18 }}>
                                        <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                                            <Target size={24} />
                                        </div>
                                        <div>
                                            <div className="metric-label">Verification Standard</div>
                                            <div className="metric-value" style={{ fontSize: '1.05rem', color: '#c7d2fe' }}>Public QR / Web</div>
                                            <div className="metric-sub">Tamper-Proof Digital Seal</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Gallery / Table */}
                                <div className="generator-card" style={{ maxWidth: '100%', padding: 28, border: '1px solid rgba(212, 175, 55, 0.4)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fef08a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Award size={22} color="#d4af37" />
                                                My Official Claimed Credentials ({myCertificates.length})
                                            </h3>
                                            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                Each certificate carries a unique governmental credential ID, dual executive signatures, and QR code verification.
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <button
                                                onClick={() => handleOpenClaimModal()}
                                                className="task-cert-btn claim"
                                                style={{ padding: '7px 14px' }}
                                            >
                                                <Award size={14} />
                                                <span>+ Claim Another Certificate</span>
                                            </button>

                                            {myCertificates.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button
                                                        onClick={() => setCertViewMode('table')}
                                                        className={`view-toggle-btn ${certViewMode === 'table' ? 'active' : ''}`}
                                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                    >
                                                        <List size={14} />
                                                        <span>Table</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setCertViewMode('cards')}
                                                        className={`view-toggle-btn ${certViewMode === 'cards' ? 'active' : ''}`}
                                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                    >
                                                        <Columns size={14} />
                                                        <span>Cards</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {myCertificates.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                                            <Award size={52} color="#d4af37" style={{ opacity: 0.35, marginBottom: 14 }} />
                                            <h3 style={{ color: '#ffffff', marginBottom: 6 }}>No Certificates Claimed Yet</h3>
                                            <p style={{ fontSize: '0.92rem', margin: '0 0 16px 0', maxWidth: '480px', marginInline: 'auto' }}>
                                                You can claim official Government Recognized Topic Mastery certificates for any topic in your syllabus right now.
                                            </p>
                                            <button
                                                onClick={() => handleOpenClaimModal()}
                                                className="claim-btn-submit"
                                                style={{ margin: '0 auto' }}
                                            >
                                                <Award size={18} />
                                                <span>Claim Your First Certificate Now</span>
                                            </button>
                                        </div>
                                    ) : certViewMode === 'table' ? (
                                        /* TABLE VIEW WITH DEDICATED GOVERNMENT AUTHORIZED COLUMN */
                                        <div className="cert-table-container">
                                            <table className="cert-table">
                                                <thead>
                                                    <tr>
                                                        <th>Credential ID</th>
                                                        <th>Candidate & Topic</th>
                                                        <th>Subject / Curriculum</th>
                                                        <th>Grade / Score</th>
                                                        <th style={{ color: '#6ee7b7' }}>🏛️ Authorized By (Govt. Body)</th>
                                                        <th>Issued Date</th>
                                                        <th style={{ textAlign: 'center' }}>Official Credential</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {myCertificates.map(c => {
                                                        const dateStr = new Date(c.issuedAt || Date.now()).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        });
                                                        return (
                                                            <tr key={c.id || c.certId}>
                                                                <td>
                                                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fef08a', fontSize: '0.82rem' }}>
                                                                        {c.certId}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.92rem' }}>
                                                                        {c.title}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                                                                        Candidate: <span style={{ color: '#cbd5e1' }}>{c.studentName || user?.username}</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ color: '#cbd5e1', fontWeight: 500 }}>{c.subject}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>{c.examName || 'Competitive Examination'}</div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                        {c.grade || 'Distinction'}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                        {c.accuracyPct}% Accuracy
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                                        <div style={{ fontWeight: 700, color: '#fef08a', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                            <span>🏛️</span>
                                                                            <span>{c.issuingAuthority || 'National Academic Evaluation & Skill Council'}</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                                            <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
                                                                                ✓ Govt. Authorized
                                                                            </span>
                                                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                                                {c.accreditationNo || 'GOV-ACCRED-2026-8834'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                                    {dateStr}
                                                                </td>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <button
                                                                        onClick={() => setClaimedCertificate(c)}
                                                                        className="quiz-action-btn"
                                                                        style={{
                                                                            background: 'rgba(212, 175, 55, 0.15)',
                                                                            color: '#fef08a',
                                                                            borderColor: 'rgba(212, 175, 55, 0.35)',
                                                                            padding: '6px 12px',
                                                                            fontSize: '0.78rem',
                                                                            margin: '0 auto'
                                                                        }}
                                                                    >
                                                                        <Award size={14} />
                                                                        <span>View / Print</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        /* CARD VIEW */
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                                            {myCertificates.map(c => (
                                                <div
                                                    key={c.id || c.certId}
                                                    style={{
                                                        background: 'linear-gradient(135deg, rgba(13, 18, 31, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%)',
                                                        border: '1px solid rgba(212, 175, 55, 0.35)',
                                                        borderRadius: 14,
                                                        padding: 18,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        gap: 14,
                                                        position: 'relative',
                                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                                                🏛️ GOVT. RECOGNIZED CREDENTIAL
                                                            </span>
                                                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>{c.certId}</span>
                                                        </div>
                                                        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.02rem', marginBottom: 4 }}>{c.title}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>{c.subject} • {c.grade}</div>

                                                        {/* Government Authorized Details */}
                                                        <div style={{ background: 'rgba(212, 175, 55, 0.06)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 8, padding: '8px 12px', fontSize: '0.76rem', color: '#cbd5e1' }}>
                                                            <div style={{ color: '#fef08a', fontWeight: 700, marginBottom: 2 }}>
                                                                🏛️ {c.issuingAuthority || 'National Academic Evaluation & Skill Council'}
                                                            </div>
                                                            <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                                                Accredited: <span style={{ color: '#6ee7b7', fontFamily: 'monospace' }}>{c.accreditationNo || 'GOV-ACCRED-2026-8834'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setClaimedCertificate(c)}
                                                        className="quiz-action-btn"
                                                        style={{
                                                            background: 'rgba(212, 175, 55, 0.15)',
                                                            color: '#fef08a',
                                                            borderColor: 'rgba(212, 175, 55, 0.35)',
                                                            justifyContent: 'center',
                                                            padding: '9px 14px'
                                                        }}
                                                    >
                                                        <Award size={15} />
                                                        <span>View / Print Certificate</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* AI Study Coach Drawer */}
            {isCoachOpen && (
                <div className="coach-drawer-overlay" onClick={() => setIsCoachOpen(false)}>
                    <div className="coach-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="coach-drawer-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Sparkles size={20} color="#818cf8" />
                                <span style={{ fontWeight: 700, color: '#ffffff' }}>AI Study Coach</span>
                            </div>
                            <button
                                onClick={() => setIsCoachOpen(false)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <button
                                onClick={() => handleAskCoach('Give me high-yield exam shortcuts & formula tricks')}
                                className="filter-pill"
                                style={{ fontSize: '0.8rem' }}
                            >
                                ⚡ Formula Tricks
                            </button>
                            <button
                                onClick={() => handleAskCoach('What is the best study strategy for today?')}
                                className="filter-pill"
                                style={{ fontSize: '0.8rem' }}
                            >
                                🎯 Study Strategy
                            </button>
                            <button
                                onClick={() => handleAskCoach('How do I memorize difficult concepts quickly?')}
                                className="filter-pill"
                                style={{ fontSize: '0.8rem' }}
                            >
                                🧠 Memory Tricks
                            </button>
                        </div>

                        <div className="coach-drawer-content">
                            {coachHistory.map((msg, i) => (
                                <div
                                    key={i}
                                    className="coach-msg-box"
                                    style={{
                                        background: msg.role === 'user' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                        borderColor: msg.role === 'user' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)'
                                    }}
                                >
                                    <div style={{ fontSize: '0.75rem', color: msg.role === 'user' ? '#818cf8' : '#34d399', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
                                        {msg.role === 'user' ? 'You' : 'AI Study Coach'}
                                    </div>
                                    <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                                    {msg.formulaOrRule && (
                                        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, color: '#fbbf24', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                            <strong>Key Rule:</strong> {msg.formulaOrRule}
                                        </div>
                                    )}

                                    {msg.keyTips && (
                                        <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#94a3b8', fontSize: '0.85rem' }}>
                                            {msg.keyTips.map((tip, idx) => (
                                                <li key={idx}>{tip}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}

                            {coachLoading && (
                                <div style={{ color: '#818cf8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                    AI Coach is analyzing...
                                </div>
                            )}
                        </div>

                        <div className="coach-drawer-input">
                            <input
                                type="text"
                                placeholder="Ask any question or concept doubt..."
                                value={coachPrompt}
                                onChange={(e) => setCoachPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAskCoach()}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: 10,
                                    padding: '10px 14px',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={() => handleAskCoach()}
                                style={{
                                    background: '#6366f1',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: 10,
                                    padding: '0 16px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Active Recall Quiz Modal & POST-QUIZ BOOSTER ARENA */}
            {quizModalOpen && (
                <div className="quiz-modal-overlay">
                    {quizLoading ? (
                        <div className="quiz-modal" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            <Sparkles size={36} style={{ color: '#a855f7', animation: 'spin 2s linear infinite', marginBottom: 12 }} />
                            <p>Synthesizing active recall drill questions...</p>
                        </div>
                    ) : !isQuizFinished && currentQuiz && currentQuiz.questions[quizStep] ? (
                        /* Active Quiz Question Card */
                        <div className="quiz-modal">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <span style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {currentQuiz.subject} • Question {quizStep + 1} of {currentQuiz.questions.length}
                                </span>
                                <button onClick={() => setQuizModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '0 0 20px 0' }}>
                                {currentQuiz.questions[quizStep].question}
                            </h3>

                            <div className="quiz-options-list">
                                {currentQuiz.questions[quizStep].options.map((opt, idx) => {
                                    const isSelected = selectedOption === idx;
                                    const isCorrect = idx === currentQuiz.questions[quizStep].answerIndex;
                                    let btnClass = '';
                                    if (selectedOption !== null) {
                                        if (isCorrect) btnClass = 'correct';
                                        else if (isSelected) btnClass = 'wrong';
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            className={`quiz-option-btn ${btnClass}`}
                                            disabled={selectedOption !== null}
                                            onClick={() => handleSelectOption(idx)}
                                        >
                                            <span style={{ fontWeight: 700, marginRight: 8 }}>
                                                {String.fromCharCode(65 + idx)}.
                                            </span>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedOption !== null && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 20 }}>
                                    <div style={{ fontWeight: 700, color: selectedOption === currentQuiz.questions[quizStep].answerIndex ? '#34d399' : '#f87171', marginBottom: 4 }}>
                                        {selectedOption === currentQuiz.questions[quizStep].answerIndex ? '✓ Correct! (+25 XP)' : '✗ Incorrect'}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                                        {currentQuiz.questions[quizStep].explanation}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleNextQuizQuestion}
                                    disabled={selectedOption === null}
                                    className="gen-submit-btn"
                                    style={{ width: 'auto', padding: '10px 24px', margin: 0 }}
                                >
                                    {quizStep + 1 < currentQuiz.questions.length ? 'Next Question' : 'Complete & Enter Arena'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* REVOLUTIONARY POST-QUIZ BOOSTER ARENA DASHBOARD */
                        <div className="booster-arena-card">
                            <div className="booster-hero">
                                <div className={`booster-badge-icon ${boosterInfo.badgeClass}`}>
                                    <boosterInfo.icon size={38} color="#ffffff" />
                                </div>
                                <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', marginBottom: 8 }}>
                                    {currentQuiz?.topic || 'Topic Mastery'} • {boosterInfo.tier}
                                </div>
                                <h2 className={`booster-title ${boosterInfo.rankClass}`}>{boosterInfo.title}</h2>
                                <p className="booster-quote">"{boosterInfo.quote}"</p>
                            </div>

                            {/* 4 Performance KPIs */}
                            <div className="booster-kpis">
                                <div className="booster-kpi-box">
                                    <div className="booster-kpi-label">Accuracy</div>
                                    <div className="booster-kpi-val" style={{ color: accuracyPct >= 70 ? '#34d399' : '#fbbf24' }}>
                                        {accuracyPct}%
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{quizScore}/{totalQ} Correct</div>
                                </div>

                                <div className="booster-kpi-box">
                                    <div className="booster-kpi-label">Scholar XP</div>
                                    <div className="booster-kpi-val" style={{ color: '#a855f7' }}>
                                        +{quizScore * 25 + 50}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Level Boosted</div>
                                </div>

                                <div className="booster-kpi-box">
                                    <div className="booster-kpi-label">Retention</div>
                                    <div className="booster-kpi-val" style={{ color: '#60a5fa', fontSize: '1.1rem', marginTop: 4 }}>
                                        {boosterInfo.retention}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Active Recall</div>
                                </div>

                                <div className="booster-kpi-box">
                                    <div className="booster-kpi-label">Mastery Tier</div>
                                    <div className="booster-kpi-val" style={{ color: '#f59e0b' }}>
                                        {boosterInfo.tier}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Exam Standard</div>
                                </div>
                            </div>

                            {/* AI Diagnostics Box */}
                            <div className="booster-diagnostics">
                                <div className="diagnostic-item">
                                    <Check size={20} color="#34d399" className="diag-icon" />
                                    <div>
                                        <div className="diag-title" style={{ color: '#34d399' }}>Demonstrated Strength</div>
                                        <div className="diag-desc">{boosterInfo.masteryPraise}</div>
                                    </div>
                                </div>

                                <div className="diagnostic-item">
                                    <AlertTriangle size={20} color="#fbbf24" className="diag-icon" />
                                    <div>
                                        <div className="diag-title" style={{ color: '#fbbf24' }}>Concept Polish Area</div>
                                        <div className="diag-desc">
                                            {accuracyPct === 100
                                                ? 'You have complete conceptual clarity. Keep this topic in your 7-day revision cycle.'
                                                : 'Focus on tricky question wording and speed math shortcuts to avoid negative marks in the final exam.'}
                                        </div>
                                    </div>
                                </div>

                                <div className="diagnostic-item">
                                    <Sparkles size={20} color="#818cf8" className="diag-icon" />
                                    <div>
                                        <div className="diag-title" style={{ color: '#818cf8' }}>AI Exam Secret Tip</div>
                                        <div className="diag-desc">
                                            In tests like RRB NTPC, 15 seconds saved by eliminating extreme choices can be reinvested into tricky numerical problems!
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Review Questions Accordion */}
                            <div className="booster-review-section">
                                <div
                                    className="review-toggle-header"
                                    onClick={() => setShowReviewDetails(!showReviewDetails)}
                                >
                                    <span>Detailed Question Breakdown ({quizAnswersRecord.length} Items)</span>
                                    {showReviewDetails ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </div>

                                {showReviewDetails && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                                        {quizAnswersRecord.map((ans, idx) => (
                                            <div key={idx} className="review-card">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>QUESTION {idx + 1}</span>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ans.isCorrect ? '#34d399' : '#f87171' }}>
                                                        {ans.isCorrect ? '✓ Correct (+25 XP)' : '✗ Missed'}
                                                    </span>
                                                </div>
                                                <div className="review-q-title">{ans.question}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 4 }}>
                                                    <strong>Your Choice:</strong> {ans.options[ans.selectedIdx]}
                                                </div>
                                                {!ans.isCorrect && (
                                                    <div style={{ fontSize: '0.85rem', color: '#34d399', marginBottom: 4 }}>
                                                        <strong>Correct Answer:</strong> {ans.options[ans.correctIdx]}
                                                    </div>
                                                )}
                                                <div className="review-explanation">
                                                    <strong>Conceptual Takeaway:</strong> {ans.explanation}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons to PUSH THEM UP! */}
                            <div className="booster-actions-grid">
                                {accuracyPct >= 66 && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                                        border: '1px solid rgba(212, 175, 55, 0.45)',
                                        borderRadius: 14,
                                        padding: '14px 18px',
                                        margin: '4px 0',
                                        textAlign: 'left'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fef08a', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                🏛️ Government Recognized Credential Ready to Claim
                                            </span>
                                            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                                                ✓ Official Accreditation Approved
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: '0.8rem', color: '#cbd5e1' }}>
                                            <div>
                                                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>ISSUING AUTHORITY:</span>
                                                <strong style={{ color: '#ffffff' }}>National Academic Evaluation & Skill Council</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>GOVT. AUTHORIZATION OVERSIGHT:</span>
                                                <strong style={{ color: '#fef08a' }}>Govt. of India Recognized Academic Board</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>ACCREDITATION CODE:</span>
                                                <span style={{ fontFamily: 'monospace', color: '#a5b4fc', fontWeight: 700 }}>GOV-ACCRED-2026-8834</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {accuracyPct >= 66 && (
                                    <button
                                        onClick={handleClaimCertificate}
                                        disabled={isIssuingCert}
                                        className="booster-primary-btn"
                                        style={{
                                            background: 'linear-gradient(135deg, #d4af37 0%, #b45309 100%)',
                                            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.45)',
                                            color: '#ffffff'
                                        }}
                                    >
                                        <Award size={18} />
                                        <span>{isIssuingCert ? 'Issuing Government Authorized Credential...' : '🏛️ Claim Government Authorized Certificate'}</span>
                                    </button>
                                )}

                                {accuracyPct < 100 ? (
                                    <button onClick={handleRetakeBooster} className="booster-primary-btn">
                                        <RotateCcw size={18} />
                                        <span>Retake Booster (Aim for 100% Mastery)</span>
                                    </button>
                                ) : (
                                    <button onClick={handleMarkTopicMasteredAndAdvance} className="booster-primary-btn">
                                        <CheckCircle2 size={18} />
                                        <span>Mark Topic Mastered & Advance (+50 XP)</span>
                                    </button>
                                )}

                                <div className="booster-secondary-row">
                                    <button onClick={handleAskCoachAboutQuiz} className="booster-sub-btn">
                                        <Sparkles size={16} color="#818cf8" />
                                        <span>Ask AI Coach For Deep Breakdown</span>
                                    </button>
                                    <button onClick={() => setQuizModalOpen(false)} className="booster-sub-btn">
                                        <span>Return to Study Schedule</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Official Prestigious Certificate Viewer */}
            {claimedCertificate && (
                <CertificateModal
                    cert={claimedCertificate}
                    onClose={() => setClaimedCertificate(null)}
                />
            )}

            {/* Official Government Certificate Claim Desk Modal */}
            {claimModalOpen && (
                <ClaimCertificateModal
                    isOpen={claimModalOpen}
                    onClose={() => setClaimModalOpen(false)}
                    defaultTask={taskToCertify}
                    allTasks={tasks}
                    examName={plan?.examName || 'Competitive Examination'}
                    user={user}
                    token={token}
                    onCertificateClaimed={(newCert) => {
                        setClaimedCertificate(newCert);
                        fetchMyCertificates();
                    }}
                />
            )}
        </div>
    );
}

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbFilePath = path.join(dataDir, 'studyplanner_store.json');

function loadStore() {
    try {
        if (fs.existsSync(dbFilePath)) {
            const raw = fs.readFileSync(dbFilePath, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[FallbackDB] Error reading store, initializing fresh:', e.message);
    }
    return {
        User: [],
        StudyPlan: [],
        StudyTask: [],
        StudySessionLog: [],
        StudyQuizLog: [],
        StudyCertificate: []
    };
}

function saveStore(store) {
    try {
        fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
        console.error('[FallbackDB] Error saving store:', e.message);
    }
}

class FallbackRequest {
    constructor() {
        this.params = {};
    }

    input(name, type, value) {
        if (value !== undefined) {
            this.params[name] = value;
        } else {
            this.params[name] = type;
        }
        return this;
    }

    async query(sqlText) {
        const store = loadStore();
        const sql = sqlText.trim();
        const params = this.params;

        // DDL: Tables or Columns creation
        if (/IF\s+NOT\s+EXISTS/i.test(sql) || /CREATE\s+TABLE/i.test(sql) || /ALTER\s+TABLE/i.test(sql)) {
            return { recordset: [] };
        }

        // --- USER QUERIES ---
        // 1. Check if user exists by username or email
        if (/SELECT\s+\*\s+FROM\s+\[User\]\s+WHERE\s+username\s*=\s*@username\s+OR\s+email\s*=\s*@email/i.test(sql)) {
            const matches = store.User.filter(u => 
                (u.username && u.username.toLowerCase() === String(params.username || '').toLowerCase()) ||
                (u.email && u.email.toLowerCase() === String(params.email || '').toLowerCase())
            );
            return { recordset: matches };
        }

        // 2. Insert new user
        if (/INSERT\s+INTO\s+\[User\]/i.test(sql)) {
            const nextId = (store.User.length > 0 ? Math.max(...store.User.map(u => u.id || 0)) : 0) + 1;
            const newUser = {
                id: nextId,
                username: params.username,
                email: params.email,
                password: params.password,
                createdAt: new Date().toISOString()
            };
            store.User.push(newUser);
            saveStore(store);
            return { recordset: [{ id: nextId }] };
        }

        // 3. Find user by usernameOrEmail for Login
        if (/SELECT\s+\*\s+FROM\s+\[User\]\s+WHERE\s+username\s*=\s*@usernameOrEmail\s+OR\s+email\s*=\s*@usernameOrEmail/i.test(sql)) {
            const target = String(params.usernameOrEmail || '').toLowerCase();
            const matches = store.User.filter(u => 
                (u.username && u.username.toLowerCase() === target) ||
                (u.email && u.email.toLowerCase() === target)
            );
            return { recordset: matches };
        }

        // --- STUDY PLAN QUERIES ---
        // 4. Insert StudyPlan
        if (/INSERT\s+INTO\s+StudyPlan/i.test(sql)) {
            const nextId = (store.StudyPlan.length > 0 ? Math.max(...store.StudyPlan.map(p => p.id || 0)) : 0) + 1;
            const newPlan = {
                id: nextId,
                userId: Number(params.userId),
                title: params.title,
                examName: params.examName,
                examDate: params.examDate,
                dailyHours: Number(params.dailyHours || 2.5),
                totalDays: Number(params.totalDays || 30),
                syllabusRaw: params.syllabusRaw || '',
                createdAt: new Date().toISOString()
            };
            store.StudyPlan.push(newPlan);
            saveStore(store);
            return { recordset: [{ id: nextId }] };
        }

        // 5. Get current StudyPlan (SELECT TOP 1 * FROM StudyPlan WHERE userId = @userId ORDER BY id DESC)
        if (/SELECT\s+TOP\s+1\s+\*\s+FROM\s+StudyPlan/i.test(sql)) {
            const uid = Number(params.userId);
            const userPlans = store.StudyPlan.filter(p => p.userId === uid).sort((a, b) => b.id - a.id);
            return { recordset: userPlans.length > 0 ? [userPlans[0]] : [] };
        }

        // 6. Delete StudyPlan
        if (/DELETE\s+FROM\s+StudyPlan/i.test(sql)) {
            const pid = Number(params.id);
            const uid = Number(params.userId);
            store.StudyPlan = store.StudyPlan.filter(p => !(p.id === pid && p.userId === uid));
            store.StudyTask = store.StudyTask.filter(t => t.planId !== pid);
            saveStore(store);
            return { recordset: [] };
        }

        // --- STUDY TASK QUERIES ---
        // 7. Insert StudyTask
        if (/INSERT\s+INTO\s+StudyTask/i.test(sql)) {
            const nextId = (store.StudyTask.length > 0 ? Math.max(...store.StudyTask.map(t => t.id || 0)) : 0) + 1;
            const newTask = {
                id: nextId,
                planId: Number(params.planId),
                userId: Number(params.userId),
                dayNumber: Number(params.dayNumber || 1),
                scheduledDate: params.scheduledDate,
                subject: params.subject,
                topic: params.topic,
                durationMinutes: Number(params.durationMinutes || 60),
                isCompleted: params.isCompleted ? 1 : 0,
                completedAt: null,
                difficulty: params.difficulty || 'Medium',
                notes: params.notes || ''
            };
            store.StudyTask.push(newTask);
            saveStore(store);
            return { recordset: [{ id: nextId }] };
        }

        // 8. Select StudyTasks by planId
        if (/SELECT\s+\*\s+FROM\s+StudyTask\s+WHERE\s+planId\s*=\s*@planId/i.test(sql)) {
            const pid = Number(params.planId);
            const tasks = store.StudyTask
                .filter(t => t.planId === pid)
                .sort((a, b) => (a.dayNumber - b.dayNumber) || (a.id - b.id));
            return { recordset: tasks };
        }

        // 9. Select single task isCompleted
        if (/SELECT\s+isCompleted\s+FROM\s+StudyTask/i.test(sql)) {
            const tid = Number(params.id);
            const uid = Number(params.userId);
            const task = store.StudyTask.find(t => t.id === tid && t.userId === uid);
            return { recordset: task ? [task] : [] };
        }

        // 10. Update StudyTask status
        if (/UPDATE\s+StudyTask\s+SET\s+isCompleted/i.test(sql)) {
            const tid = Number(params.id);
            const isComp = Boolean(params.newStatus);
            const task = store.StudyTask.find(t => t.id === tid);
            if (task) {
                task.isCompleted = isComp ? 1 : 0;
                task.completedAt = isComp ? new Date().toISOString() : null;
                saveStore(store);
            }
            return { recordset: [] };
        }

        // --- STUDY SESSION LOG ---
        if (/INSERT\s+INTO\s+StudySessionLog/i.test(sql)) {
            const nextId = (store.StudySessionLog.length > 0 ? Math.max(...store.StudySessionLog.map(s => s.id || 0)) : 0) + 1;
            const newLog = {
                id: nextId,
                userId: Number(params.userId),
                planId: params.planId ? Number(params.planId) : null,
                minutes: Number(params.minutes || 0),
                sessionDate: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };
            store.StudySessionLog.push(newLog);
            saveStore(store);
            return { recordset: [{ id: nextId }] };
        }

        // --- QUIZ LOGS ---
        if (/INSERT\s+INTO\s+StudyQuizLog/i.test(sql)) {
            const nextId = (store.StudyQuizLog.length > 0 ? Math.max(...store.StudyQuizLog.map(q => q.id || 0)) : 0) + 1;
            const newQuiz = {
                id: nextId,
                userId: Number(params.userId),
                topic: params.topic,
                subject: params.subject,
                totalQuestions: Number(params.totalQuestions || 0),
                score: Number(params.score || 0),
                accuracyPct: Number(params.accuracyPct || 0),
                createdAt: new Date().toISOString()
            };
            store.StudyQuizLog.push(newQuiz);
            saveStore(store);
            return { recordset: [{ id: nextId }] };
        }

        if (/SELECT\s+TOP\s+10\s+\*\s+FROM\s+StudyQuizLog/i.test(sql)) {
            const uid = Number(params.userId);
            const logs = store.StudyQuizLog
                .filter(q => q.userId === uid)
                .sort((a, b) => b.id - a.id)
                .slice(0, 10);
            return { recordset: logs };
        }

        // --- CERTIFICATES ---
        if (/INSERT\s+INTO\s+StudyCertificate/i.test(sql)) {
            const nextId = (store.StudyCertificate.length > 0 ? Math.max(...store.StudyCertificate.map(c => c.id || 0)) : 0) + 1;
            const newCert = {
                id: nextId,
                certId: params.certId,
                userId: Number(params.userId),
                studentName: params.studentName,
                title: params.title,
                subject: params.subject,
                examName: params.examName,
                score: Number(params.score || 0),
                accuracyPct: Number(params.accuracyPct || 0),
                grade: params.grade,
                issuingAuthority: params.issuingAuthority || 'National Academic Evaluation & Skill Council (Govt. of India Recognized)',
                authorizedBy: params.authorizedBy || 'Government of India Recognized Board',
                accreditationNo: params.accreditationNo || 'GOV-ACCRED-2026-8834',
                govApprovalCode: params.govApprovalCode || 'GOV-MHRD/NAAC-2026',
                issuedAt: new Date().toISOString()
            };
            store.StudyCertificate.push(newCert);
            saveStore(store);
            return { recordset: [{ id: nextId }] };
        }

        if (/FROM\s+StudyCertificate\s+WHERE\s+userId\s*=\s*@userId/i.test(sql)) {
            const uid = Number(params.userId);
            const certs = store.StudyCertificate
                .filter(c => c.userId === uid)
                .sort((a, b) => b.id - a.id);
            return { recordset: certs };
        }

        if (/FROM\s+StudyCertificate\s+WHERE\s+certId\s*=\s*@certId/i.test(sql)) {
            const cid = String(params.certId || '').trim();
            const certs = store.StudyCertificate.filter(c => c.certId === cid);
            return { recordset: certs };
        }

        // Generic fallback query handler
        console.warn('[FallbackDB] Unhandled SQL query, returning empty set:', sql.slice(0, 100));
        return { recordset: [] };
    }
}

class FallbackPool {
    constructor() {
        this.connected = true;
    }

    request() {
        return new FallbackRequest();
    }
}

// Emulate mssql data types
const fallbackSql = {
    Int: 'Int',
    VarChar: (len) => 'VarChar',
    NVarChar: (len) => 'NVarChar',
    Date: 'Date',
    Decimal: (p, s) => 'Decimal',
    Bit: 'Bit',
    MAX: 'MAX'
};

const fallbackPoolInstance = new FallbackPool();

module.exports = {
    fallbackSql,
    fallbackPoolInstance
};

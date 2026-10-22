USE AIStudyPlanner;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StudyPlan')
BEGIN
    CREATE TABLE StudyPlan (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL FOREIGN KEY REFERENCES [User](id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        examName VARCHAR(255) NOT NULL,
        examDate DATE NOT NULL,
        dailyHours DECIMAL(4,2) DEFAULT 2.0,
        totalDays INT DEFAULT 30,
        syllabusRaw NVARCHAR(MAX),
        createdAt DATETIME DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StudyTask')
BEGIN
    CREATE TABLE StudyTask (
        id INT IDENTITY(1,1) PRIMARY KEY,
        planId INT NOT NULL FOREIGN KEY REFERENCES StudyPlan(id) ON DELETE CASCADE,
        userId INT NOT NULL FOREIGN KEY REFERENCES [User](id),
        dayNumber INT NOT NULL,
        scheduledDate DATE NOT NULL,
        subject VARCHAR(150) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        durationMinutes INT DEFAULT 60,
        isCompleted BIT DEFAULT 0,
        completedAt DATETIME NULL,
        difficulty VARCHAR(50) DEFAULT 'Medium',
        notes NVARCHAR(MAX) NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StudySessionLog')
BEGIN
    CREATE TABLE StudySessionLog (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL FOREIGN KEY REFERENCES [User](id) ON DELETE CASCADE,
        planId INT NULL,
        minutes INT NOT NULL,
        sessionDate DATE DEFAULT CAST(GETDATE() AS DATE),
        createdAt DATETIME DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StudyCertificate')
BEGIN
    CREATE TABLE StudyCertificate (
        id INT IDENTITY(1,1) PRIMARY KEY,
        certId VARCHAR(50) NOT NULL UNIQUE,
        userId INT NOT NULL FOREIGN KEY REFERENCES [User](id) ON DELETE CASCADE,
        studentName VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(150) NOT NULL,
        examName VARCHAR(150) NOT NULL,
        score INT DEFAULT 3,
        accuracyPct INT DEFAULT 100,
        grade VARCHAR(50) DEFAULT 'Distinction (S-Tier)',
        issuingAuthority VARCHAR(255) DEFAULT 'National Academic Evaluation & Skill Council (Govt. of India Recognized)',
        authorizedBy VARCHAR(255) DEFAULT 'Government of India Recognized Board',
        accreditationNo VARCHAR(100) DEFAULT 'GOV-ACCRED-2026-8834',
        govApprovalCode VARCHAR(100) DEFAULT 'GOV-MHRD/NAAC-2026',
        issuedAt DATETIME DEFAULT GETDATE()
    );
END
GO


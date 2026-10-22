IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AIStudyPlanner')
BEGIN
    CREATE DATABASE AIStudyPlanner;
END
GO

USE AIStudyPlanner;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'User')
BEGIN
    CREATE TABLE [User] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        createdAt DATETIME DEFAULT GETDATE()
    );
END
GO

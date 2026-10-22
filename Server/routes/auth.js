const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../config/db');

// Register a new user
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const pool = await poolPromise;
        
        // Check if user already exists (username or email)
        const checkUser = await pool.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM [User] WHERE username = @username OR email = @email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Username or Email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .query('INSERT INTO [User] (username, email, password) VALUES (@username, @email, @password)');

        res.status(201).json({ success: true, message: 'User registered successfully!' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const pool = await poolPromise;

        // Find user by username or email
        const userResult = await pool.request()
            .input('usernameOrEmail', sql.VarChar, usernameOrEmail)
            .query('SELECT * FROM [User] WHERE username = @usernameOrEmail OR email = @usernameOrEmail');

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const user = userResult.recordset[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;

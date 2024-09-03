// Import required modules
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const { check, validationResult } = require('express-validator');
const path = require('path');

// Initialize the Express application
const app = express();
const port = 5500;

// Start the server
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configure CORS to allow requests from a specific origin
app.use(cors({
    origin: "http://localhost:5500"
}));

// Configure session middleware for handling user sessions
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Middleware to serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse incoming JSON data and URL-encoded data
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: '######',
    password: '######',
    database: 'chama_fintechDB'
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
});

// Registration route
app.post('/register', [
    check('Telephone').isMobilePhone().withMessage('Invalid Telephone number'),
    check('username').isAlphanumeric().withMessage('Username must be alphanumeric'),
    check('Telephone').custom(async (value) => {
        const existingClient = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM clients WHERE Telephone = ?', [value], (err, results) => {
                if (err) reject(err);
                resolve(results[0]);
            });
        });
        if (existingClient) {
            throw new Error('Telephone already exists');
        }
    }),
    check('username').custom(async (value) => {
        const existingClient = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM clients WHERE username = ?', [value], (err, results) => {
                if (err) reject(err);
                resolve(results[0]);
            });
        });
        if (existingClient) {
            throw new Error('Username already exists');
        }
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const newClient = {
        Telephone: req.body.Telephone,
        username: req.body.username,
        password: hashedPassword
    };

    connection.query('INSERT INTO clients SET ?', newClient, (error, results) => {
        if (error) {
            console.error('Error inserting client: ' + error.message);
            return res.status(500).json({ error: error.message });
        }
        console.log('Inserted a new client with userId ' + results.insertId);
        res.status(201).json(newClient);
    });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    connection.query('SELECT * FROM clients WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        const client = results[0];
        bcrypt.compare(password, client.password, (err, isMatch) => {
            if (err) throw err;
            if (!isMatch) {
                return res.status(401).send('Invalid username or password');
            }

            // Save client session
            req.session.client = client;

            res.status(200).json({
                username: client.username,
                Telephone: client.Telephone
            });
        });
    });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.sendStatus(200);
    });
});

// Test Route to check if the server is working
app.get('/test', (req, res) => {
    res.send('Server is working!');
});

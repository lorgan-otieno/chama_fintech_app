const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const { check, validationResult } = require('express-validator');

const app = express();
const port = 3000;

// Configure session middleware
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the public directory
app.use(express.static('public'));

// Set up middleware to parse incoming JSON data
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Root route to serve the index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '#pword###3',
    database: 'chama_fintechDB'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
});

// Define client representation for clarity
const clients = {
    tableName: 'clients',
    createclient: function (newclient, callback) {
        connection.query('INSERT INTO ' + this.tableName + ' SET ?', newclient, callback);
    },
    getclientByTelephone: function (Telephone, callback) {
        connection.query('SELECT * FROM ' + this.tableName + ' WHERE Telephone = ?', [Telephone], callback);
    },
    getclientByUsername: function (username, callback) {
        connection.query('SELECT * FROM ' + this.tableName + ' WHERE username = ?', [username], callback);
    }
};

// Registration route
app.post('/register', [
    check('Telephone').isMobilePhone().withMessage('Invalid Telephone number'),
    check('username').isAlphanumeric().withMessage('Username must be alphanumeric'),
    check('Telephone').custom(async (value) => {
        const existingClient = await new Promise((resolve, reject) => {
            clients.getclientByTelephone(value, (err, results) => {
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
            clients.getclientByUsername(value, (err, results) => {
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

    clients.createclient(newClient, (error, results) => {
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

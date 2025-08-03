// server.js - Main Express server file 
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json({ limit: '50mb' })); // For JSON data - increased limit for base64 images
app.use(express.static("frontend")); // Serve static files

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the ID Generator app!');
});

// Initialize database
const dbPath = path.join(__dirname, 'database', 'students.db');
// Ensure database directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database');
        // Create students table if it doesn't exist
        // Create 'students' table if not exists
        db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    fathername TEXT NOT NULL,
    course TEXT NOT NULL,
    bloodGroup TEXT NOT NULL,
    contactNumber TEXT NOT NULL,
    issueDate TEXT NOT NULL,
    session TEXT NOT NULL,
    photo TEXT,
    signature TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
            if (err) {
                console.error('Error creating table', err.message);
            } else {
                console.log('Students table ready');

                // 🔧 Add 'category' column if not already present
                db.all("PRAGMA table_info(students);", (err, columns) => {
                    if (err) {
                        console.error('Failed to check columns', err.message);
                        return;
                    }

                    const hasCategory = columns.some(col => col.name === "category");

                    if (!hasCategory) {
                        db.run("ALTER TABLE students ADD COLUMN category TEXT", (err) => {
                            if (err) {
                                console.error('Failed to add category column:', err.message);
                            } else {
                                console.log("Category column added to students table.");
                            }
                        });
                    } else {
                        console.log("Category column already exists.");
                    }
                });

            }
        });

    }
});

// ROUTES


// Get all students
app.get('/api/students', (_req, res) => {
    db.all('SELECT id, roll, name, fathername, course, bloodGroup, contactNumber, issueDate, session, category, createdAt FROM students ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get student by roll number
app.get('/api/students/roll/:roll', (req, res) => {
    const { roll } = req.params;
    db.get('SELECT * FROM students WHERE roll = ?', [roll], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }
        res.json(row);
    });
});

// Search students by roll or name
app.get('/api/students/search', (req, res) => {
    const { term } = req.query;
    const searchTerm = `%${term}%`;

    db.all(
        'SELECT id, roll, name, fathername, course FROM students WHERE roll LIKE ? OR name LIKE ?',
        [searchTerm, searchTerm],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// Create a new student
app.post('/api/students', (req, res) => {
    const { roll, name, fathername, course, bloodGroup, contactNumber, issueDate, session, photo, signature, category } = req.body;

    // Validate required fields
    if (!roll || !name || !fathername || !course || !bloodGroup || !contactNumber || !issueDate || !session) {
        res.status(400).json({ error: 'All fields are required' });
        return;
    }

    // Validate contact number format (10 digits)
    if (!/^\d{10}$/.test(contactNumber)) {
        res.status(400).json({ error: 'Contact number must be 10 digits' });
        return;
    }

    const query = `INSERT INTO students 
  (roll, name, fathername, course, bloodGroup, contactNumber, issueDate, session, photo, signature, category) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [roll, name, fathername, course, bloodGroup, contactNumber, issueDate, session, photo, signature, category],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(409).json({ error: 'A student with this roll number already exists' });
                } else {
                    res.status(500).json({ error: err.message });
                }
                return;
            }

            res.status(201).json({
                id: this.lastID,
                message: 'Student created successfully'
            });
        });
});

// Update student
app.put('/api/students/:id', (req, res) => {
    const { id } = req.params;
    const { roll, name, fathername, course, bloodGroup, contactNumber, issueDate, session, photo, signature } = req.body;

    // Validate required fields
    if (!roll || !name || !fathername || !course || !bloodGroup || !contactNumber || !issueDate || !session) {
        res.status(400).json({ error: 'All fields are required' });
        return;
    }

    const query = `UPDATE students SET 
                  roll = ?, name = ?, fathername = ?, course = ?, 
                  bloodGroup = ?, contactNumber = ?, issueDate = ?, session = ?,
                  photo = ?, signature = ?
                  WHERE id = ?`;

    db.run(query, [roll, name, fathername, course, bloodGroup, contactNumber, issueDate, session, photo, signature, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (this.changes === 0) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }

        res.json({ message: 'Student updated successfully' });
    });
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM students WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (this.changes === 0) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }

        res.json({ message: 'Student deleted successfully' });
    });
});

// Delete all students
app.delete('/api/students', (_req, res) => {
    db.run('DELETE FROM students', function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({
            message: 'All students deleted successfully',
            deletedCount: this.changes
        });
    });
});

// Export data to JSON
app.get('/api/export/json', (_req, res) => {
    db.all('SELECT * FROM students', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Set headers for file download
        res.setHeader('Content-Disposition', 'attachment; filename=students.json');
        res.setHeader('Content-Type', 'application/json');
        res.json(rows);
    });
});

// Get students by category
app.get('/api/students/category/:category', (req, res) => {
    const { category } = req.params;
    db.all('SELECT * FROM students WHERE category = ?', [category], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});


// Server startup
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Database connection closed');
        process.exit(0);
    });
});

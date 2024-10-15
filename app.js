const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Database connection
const pool = new Pool({
    user: 'root', 
    host: 'localhost',
    database: 'blogdb',
    password: 'password', 
});

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1800000 // 30 minutes
    }
}));

// Set up EJS for templating
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Home page
app.get('/', async (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/signin');
    }
    
    const query = 'SELECT * FROM blogs ORDER BY date_created DESC';
    const { rows } = await pool.query(query);
    res.render('index', { blogs: rows });
});

// Signup page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Handle signup form submission
app.post('/signup', async (req, res) => {
    const { user_id, password, name } = req.body;

    // Check if user_id already exists
    const checkQuery = 'SELECT * FROM users WHERE user_id = $1';
    const { rows: existingUsers } = await pool.query(checkQuery, [user_id]);

    if (existingUsers.length > 0) {
        // User_id already exists, redirect back to signup page with error message
        res.render('signup', { error: 'User ID already exists' });
    } else {
        // Insert new user
        const insertQuery = 'INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)';
        await pool.query(insertQuery, [user_id, password, name]);

        // Redirect to signin page
        res.redirect('/signin');
    }
});

// Signin page
app.get('/signin', (req, res) => {
    res.render('signin');
});

// Handle signin form submission
app.post('/signin', async (req, res) => {
    const { user_id, password } = req.body;

    // Check if user_id and password match
    const checkQuery = 'SELECT * FROM users WHERE user_id = $1 AND password = $2';
    const { rows: users } = await pool.query(checkQuery, [user_id, password]);

    if (users.length === 0) {
        // Invalid credentials, redirect back to signin page with error message
        res.render('signin', { error: 'Invalid user ID or password' });
    } else {
        // Successful signin, create session and redirect to home page
        req.session.user_id = users[0].user_id;
        res.redirect('/');
    }
});

// Signout
app.get('/signout', (req, res) => {
    req.session.destroy();
    res.redirect('/signin');
});

// Create-post page
app.get('/create-post', (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/signin');
    }
    res.render('create-post');
});

// Add more routes for post creation, editing, and deletion
// Create new post
app.post('/create-post', async (req, res) => {
    const { title, body } = req.body;
    const creator_user_id = req.session.user_id; 

    const insertQuery = 'INSERT INTO blogs (title, body, creator_user_id) VALUES ($1, $2, $3)';
    await pool.query(insertQuery, [title, body, creator_user_id]);

    res.redirect('/');
});

// Edit-post page
app.get('/edit-post/:id', async (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/signin');
    }

    const blogId = req.params.id;

    const selectQuery = 'SELECT * FROM blogs WHERE blog_id = $1';
    const { rows } = await pool.query(selectQuery, [blogId]);

    res.render('edit-post', { blog: rows[0] });
});

// Edit existing post
app.post('/edit-post/:id', async (req, res) => {
    const { title, body } = req.body;
    const blogId = req.params.id;

    const updateQuery = 'UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3';
    await pool.query(updateQuery, [title, body, blogId]);

    res.redirect('/');
});

// Delete-post page
app.get('/delete-post/:id', async (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/signin');
    }

    const blogId = req.params.id;

    const selectQuery = 'SELECT * FROM blogs WHERE blog_id = $1';
    const { rows } = await pool.query(selectQuery, [blogId]);

    res.render('delete-post', { blog: rows[0] });
});

// Delete existing post
app.post('/delete-post/:id', async (req, res) => {
    const blogId = req.params.id;

    const deleteQuery = 'DELETE FROM blogs WHERE blog_id = $1';
    await pool.query(deleteQuery, [blogId]);

    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
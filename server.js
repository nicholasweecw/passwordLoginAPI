// If for development (and not production), import .env variables and save them in process.env
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
// To use delete method by overriding post method
const methodOverride = require('method-override')


// To find user and their passport based on email
const initializePassport = require('./passport-config')
initializePassport(
    passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

// Using array instead of database for simple storage (use databases for actual production!)
const users = []

// Allow application to use .ejs files for client-side
app.set('view-engine', 'ejs')
// Allow application to access data from forms
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))


// ROUTES



// Link to Home page (index.ejs)
app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name : req.user.name})
})

// Link to Login.ejs page
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

// Method to login
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

// Link to Register.ejs page
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

// Method to register
// Use async to use try catch
// Use await because asynchronous (to wait for hash() 
// function to be done)
app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        // Redirect to login page if register successful
        res.redirect('/login')
    } catch {
        // Redirect to register page if register unsuccessful
        res.redirect('/register')
    }
})

// Logout function
app.delete('/logout', (req, res) => {
    // Updated version of req.logout (to prevent session fixation attacks)
    req.logOut(function(err) {
        if (err) { return next(err) }
        res.redirect('/login')
    })
})

// Prevents users that have not registered from accessing home page
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

// Check to prevent users who are not authenticated from accessing login page
// (E.g Prevents users that are already logged in from going back to login page)
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

app.listen(3000)
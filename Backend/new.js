import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import path from 'path';
import cors from 'cors';
import fetch from 'node-fetch';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const app = express();
const port = 3000;
const saltRounds = 10;
const __dirname = path.resolve();

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PASSWORD = process.env.PASSWORD

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB Atlas
mongoose.connect(`mongodb+srv://ojhapranav14:${PASSWORD}@cluster0.soarpjf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a mongoose schema for user
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
});

// Create a mongoose model based on the schema
const User = mongoose.model('User', userSchema);

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ googleId: profile.id });
      if (existingUser) {
        return done(null, existingUser);
      }

      const newUser = new User({
        email: profile.emails[0].value,
        googleId: profile.id
      });

      await newUser.save();
      return done(null, newUser);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../Login/login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../Login/signup.html'));
});

app.get('/form', (req, res) => {
  res.redirect('http://localhost:5000/');
});

app.get('/result', (req, res) => {
  const premium = req.query.premium;
  res.sendFile(path.join(__dirname, '../Login/result.html'), { premium });
});

app.options('/predict', cors());

// Existing signup and login routes
app.post('/signup', async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      res.send('Email already exists. Try logging in.');
    } else {
      // Hash the password and save it in the database
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = new User({
        email: email,
        password: hashedPassword,
      });
      await newUser.save();
      res.sendFile(path.join(__dirname, '../Login/login.html'));
    }
  } catch (err) {
    console.log(err);
    res.send('Error registering user.');
  }
});

app.post('/login', async (req, res) => {
  if (req.body.username) {
    const email = req.body.username;
    const loginPassword = req.body.password;

    try {
      console.log('Attempting login with email:', email);

      // Find user by email
      const user = await User.findOne({ email: email });
      if (user) {
        // Compare passwords
        const passwordMatch = await bcrypt.compare(loginPassword, user.password);
        if (passwordMatch) {
          // Redirect to form.html upon successful login
          res.status(200).json({ redirectTo: '/form' });
        } else {
          res.status(401).json({ error: 'Incorrect password' });
        }
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ error: 'Error logging in' });
    }
  } else {
    res.status(400).json({ error: 'Username not provided' });
  }
});

// Google Auth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to the form page.
    res.redirect('/form');
  }
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const connectDatabase = require('./src/config/database');
const apiRoutes = require('./src/routes/api');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3002;
const sessionSecret = process.env.SESSION_SECRET || 'local-development-secret-change-before-deploying';

if (process.env.NODE_ENV === 'production' && sessionSecret === 'local-development-secret-change-before-deploying') {
  throw new Error('Set a strong SESSION_SECRET before starting in production.');
}

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: 'school.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test',
    collectionName: 'sessions',
    ttl: 8 * 60 * 60
  }),
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

app.use('/api', apiRoutes);
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: 'Unexpected server error.' });
});

connectDatabase()
  .then(() => app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`)))
  .catch(error => {
    console.error(`Unable to connect to MongoDB: ${error.message}`);
    process.exitCode = 1;
  });

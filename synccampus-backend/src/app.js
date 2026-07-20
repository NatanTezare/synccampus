const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const venueBookingRoutes = require('./routes/venueBookingRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const shuttleRoutes = require('./routes/shuttleRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ success: true, message: 'SyncCampus API is running.' }));

app.use('/api/auth', authRoutes);
app.use('/api', venueBookingRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', shuttleRoutes);


// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
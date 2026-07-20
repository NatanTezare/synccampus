const AvailabilityModel = require('../models/availabilityModel');

const VALID_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// POST /api/availability — Faculty adds a recurring weekly block
exports.createAvailability = async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;

    if (!VALID_DAYS.includes(dayOfWeek)) {
      return res.status(400).json({ success: false, message: 'Please select a valid day of the week.' });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time.' });
    }

    const slot = await AvailabilityModel.create({ facultyId: req.user.id, dayOfWeek, startTime, endTime });
    res.status(201).json({ success: true, message: 'Availability added.', data: slot });
  } catch (err) {
    next(err);
  }
};

// GET /api/availability/my — Faculty views their own weekly template
exports.getMyAvailability = async (req, res, next) => {
  try {
    const slots = await AvailabilityModel.findByFaculty(req.user.id);
    res.status(200).json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/availability/:id — Faculty removes a weekly block
exports.deleteAvailability = async (req, res, next) => {
  try {
    const removed = await AvailabilityModel.deactivate({ id: req.params.id, facultyId: req.user.id });
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Availability block not found.' });
    }
    res.status(200).json({ success: true, message: 'Availability removed.', data: removed });
  } catch (err) {
    next(err);
  }
};
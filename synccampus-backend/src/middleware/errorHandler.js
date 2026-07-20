module.exports = (err, req, res, next) => {
  console.error(err.stack);

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'This record already exists or conflicts with an existing booking.' });
  }

  // Postgres FK violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced record does not exist.' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong on our end. Please try again.',
  });
};
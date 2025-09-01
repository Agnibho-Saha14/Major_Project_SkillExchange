const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(status).json({
    success: false,
    message: status === 500 ? 'Something went wrong!' : err.message,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
};

module.exports = { errorHandler };

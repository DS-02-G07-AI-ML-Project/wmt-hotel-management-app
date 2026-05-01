const errorHandler = (err, req, res, next) => {
    let message = err.message;

    if (err.name === 'ValidationError') {
        message = Object.values(err.errors).map((item) => item.message).join(', ');
    }

    if (err.code === 11000) {
        const fields = Object.keys(err.keyValue || {}).join(', ') || 'field';
        message = `A record with this ${fields} already exists`;
        res.status(400);
    }

    if (err.name === 'CastError') {
        message = `Invalid ${err.path || 'id'} value`;
        res.status(400);
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        success: false,
        message,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;

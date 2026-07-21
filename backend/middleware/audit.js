const pool = require('../db/pool');

async function auditMiddleware(req, res, next) {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Intercept response to capture status
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const statusCode = res.statusCode;
    if (req.user && statusCode < 400) {
      pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT DO NOTHING`,
        [
          req.user.id || req.user.userId,
          req.method,
          req.path.split('/').filter(Boolean)[0] || 'unknown',
          req.params?.id || null,
          JSON.stringify({ status: statusCode }),
          null,
        ]
      ).catch(err => console.error('Audit log error:', err.message));
    }
    return originalJson(data);
  };

  next();
}

module.exports = auditMiddleware;

import AdminActivityLog from '../models/AdminActivityLog.js';

/**
 * Middleware factory to log admin actions to AdminActivityLog
 * @param {string} action - Action description
 * @param {string} targetModel - Target model name
 */
const auditLog = (action, targetModel = null) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override res.json to capture response
    res.json = function (body) {
      // Log only on success responses
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const targetId = body?.data?._id || req.params?.id || null;

        AdminActivityLog.create({
          admin: req.user._id,
          action,
          targetModel,
          targetId,
          details: {
            method: req.method,
            path: req.path,
            body: req.body,
          },
          ipAddress: req.ip || req.connection.remoteAddress,
        }).catch((err) => console.error('Audit log error:', err));
      }

      return originalJson(body);
    };

    next();
  };
};

export default auditLog;

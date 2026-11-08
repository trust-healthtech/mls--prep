'use strict';

const {
  sendJson,
  originAllowed,
  redisReady,
  vapidReady
} = require('../../lib/notifications');

module.exports = async function handler(req, res) {
  if (!originAllowed(req)) {
    return sendJson(res, 403, {
      success: false,
      error: 'Origin not allowed.'
    });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, {
      success: false,
      error: 'Method not allowed.'
    });
  }

  if (!redisReady() || !vapidReady()) {
    return sendJson(res, 503, {
      success: false,
      error: 'Notification service is not fully configured.'
    });
  }

  return sendJson(res, 200, {
    success: true,
    enabled: true,
    publicKey: process.env.VAPID_PUBLIC_KEY
  });
};

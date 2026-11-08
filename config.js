'use strict';
const { sendJson, originAllowed, vapidReady } = require('../../lib/notifications');
module.exports = (req, res) => {
  if (req.method !== 'GET') return sendJson(res, 405, { success: false, message: 'Method not allowed.' });
  if (!originAllowed(req)) return sendJson(res, 403, { success: false, message: 'Origin not allowed.' });
  if (!vapidReady()) return sendJson(res, 503, { success: false, message: 'Push notifications are not configured on the server.' });
  return sendJson(res, 200, { success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
};

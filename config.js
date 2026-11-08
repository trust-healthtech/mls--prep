'use strict';
const { sendJson, originAllowed, vapidReady, redisReady } = require('../../lib/notifications');
module.exports = (req, res) => {
  if (req.method !== 'GET') return sendJson(res, 405, { success: false, message: 'Method not allowed.' });
  if (!originAllowed(req)) return sendJson(res, 403, { success: false, message: 'Origin not allowed.' });
  const required = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'KV_REST_API_URL', 'KV_REST_API_TOKEN'];
  const missing = required.filter(name => !process.env[name]);
  if (!vapidReady() || !redisReady()) {
    return sendJson(res, 503, {
      success: false,
      message: 'THT push setup is incomplete. Configure these Vercel environment variables: ' + missing.join(', ') + '.',
      missing
    });
  }
  return sendJson(res, 200, { success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
};

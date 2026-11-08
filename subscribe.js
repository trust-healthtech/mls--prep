'use strict';
const { sendJson, originAllowed, redis, endpointId, redisReady, vapidReady } = require('../../lib/notifications');
const KEY = 'tht:push:subscriptions';
const ALLOWED = new Set(['materials', 'cbt', 'announcements']);
module.exports = async (req, res) => {
  if (!originAllowed(req)) return sendJson(res, 403, { success: false, message: 'Origin not allowed.' });
  if (!redisReady() || !vapidReady()) return sendJson(res, 503, { success: false, message: 'Push notification service is not fully configured.' });
  if (!['POST', 'DELETE'].includes(req.method)) return sendJson(res, 405, { success: false, message: 'Method not allowed.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (req.method === 'DELETE') {
      if (typeof body.endpoint !== 'string' || !body.endpoint.startsWith('https://')) return sendJson(res, 400, { success: false, message: 'Invalid subscription endpoint.' });
      await redis(['HDEL', KEY, endpointId(body.endpoint)]);
      return sendJson(res, 200, { success: true });
    }
    const sub = body.subscription;
    if (!sub || typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://') || !sub.keys || typeof sub.keys.p256dh !== 'string' || typeof sub.keys.auth !== 'string') {
      return sendJson(res, 400, { success: false, message: 'A valid browser push subscription is required.' });
    }
    const categories = Array.isArray(body.categories) ? body.categories.filter(x => ALLOWED.has(x)) : [];
    if (!categories.length) return sendJson(res, 400, { success: false, message: 'Select at least one notification category.' });
    const record = { subscription: sub, categories, updatedAt: Date.now() };
    await redis(['HSET', KEY, endpointId(sub.endpoint), JSON.stringify(record)]);
    return sendJson(res, 200, { success: true, message: 'Device subscription saved.' });
  } catch (error) {
    return sendJson(res, 500, { success: false, message: error.message || 'Could not save subscription.' });
  }
};

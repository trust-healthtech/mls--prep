'use strict';
const webpush = require('web-push');
const { sendJson, redis, redisReady, vapidReady } = require('../../lib/notifications');
const ALLOWED = new Set(['materials', 'cbt', 'announcements']);
module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { success: false, message: 'Method not allowed.' });
  const secret = process.env.NOTIFICATION_ADMIN_TOKEN;
  const auth = req.headers.authorization || '';
  if (!secret || auth !== `Bearer ${secret}`) return sendJson(res, 401, { success: false, message: 'Unauthorized.' });
  if (!redisReady() || !vapidReady()) return sendJson(res, 503, { success: false, message: 'Push notification service is not fully configured.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const category = body.category;
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 90) : '';
    const message = typeof body.body === 'string' ? body.body.trim().slice(0, 220) : '';
    const url = typeof body.url === 'string' && body.url.startsWith('/') && !body.url.startsWith('//') ? body.url : '/';
    if (!ALLOWED.has(category) || !title || !message) return sendJson(res, 400, { success: false, message: 'Provide a valid category, title and body.' });

    webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    const rows = await redis(['HGETALL', 'tht:push:subscriptions']);
    if (!Array.isArray(rows) || !rows.length) return sendJson(res, 200, { success: true, sent: 0, expired: 0, message: 'No subscribed devices yet.' });
    let sent = 0, expired = 0, skipped = 0;
    for (let i = 0; i < rows.length; i += 2) {
      const id = rows[i], raw = rows[i + 1];
      let record;
      try { record = JSON.parse(raw); } catch { skipped++; continue; }
      if (!record.categories || !record.categories.includes(category)) { skipped++; continue; }
      try {
        await webpush.sendNotification(record.subscription, JSON.stringify({ title, body: message, url, tag: `tht-${category}` }), { TTL: 60 * 60 * 24 });
        sent++;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) { await redis(['HDEL', 'tht:push:subscriptions', id]); expired++; }
        else skipped++;
      }
    }
    return sendJson(res, 200, { success: true, sent, expired, skipped });
  } catch (error) {
    return sendJson(res, 500, { success: false, message: error.message || 'Notification delivery failed.' });
  }
};

'use strict';

const webpush = require('web-push');

const {
  sendJson,
  originAllowed,
  redis,
  redisReady,
  vapidReady
} = require('../../lib/notifications');

const STORAGE_KEY = 'tht:push:subscriptions';

const ALLOWED_CATEGORIES = [
  'materials',
  'cbt',
  'announcements'
];

function getBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return null;
    }
  }

  return null;
}

module.exports = async function handler(req, res) {
  if (!originAllowed(req)) {
    return sendJson(res, 403, {
      success: false,
      error: 'Origin not allowed.'
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, {
      success: false,
      error: 'Method not allowed.'
    });
  }

  const adminToken = process.env.NOTIFICATION_ADMIN_TOKEN;
  const authorization = req.headers.authorization || '';

  if (
    !adminToken ||
    authorization !== `Bearer ${adminToken}`
  ) {
    return sendJson(res, 401, {
      success: false,
      error: 'Unauthorized.'
    });
  }

  if (!redisReady() || !vapidReady()) {
    return sendJson(res, 503, {
      success: false,
      error: 'Notification service is not fully configured.'
    });
  }

  const body = getBody(req);

  if (!body) {
    return sendJson(res, 400, {
      success: false,
      error: 'Invalid request body.'
    });
  }

  const { category, title, message, url } = body;

  if (!ALLOWED_CATEGORIES.includes(category)) {
    return sendJson(res, 400, {
      success: false,
      error: 'Invalid notification category.'
    });
  }

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.length > 100 ||
    typeof message !== 'string' ||
    !message.trim() ||
    message.length > 300
  ) {
    return sendJson(res, 400, {
      success: false,
      error: 'Provide a title and message within the allowed lengths.'
    });
  }

  const targetUrl =
    typeof url === 'string' &&
    url.startsWith('/') &&
    !url.startsWith('//')
      ? url
      : '/';

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const entries = await redis([
      'HGETALL',
      STORAGE_KEY
    ]);

    if (!Array.isArray(entries)) {
      throw new Error('Unexpected subscription storage response.');
    }

    const payload = JSON.stringify({
      title: title.trim(),
      body: message.trim(),
      url: targetUrl,
      category
    });

    let sent = 0;
    let failed = 0;
    let removed = 0;

    for (let i = 0; i < entries.length; i += 2) {
      const id = entries[i];
      const rawRecord = entries[i + 1];

      if (!id || !rawRecord) continue;

      let record;

      try {
        record = JSON.parse(rawRecord);
      } catch (_) {
        await redis(['HDEL', STORAGE_KEY, id]);
        removed++;
        continue;
      }

      if (
        !record.categories ||
        !record.categories.includes(category) ||
        !record.subscription
      ) {
        continue;
      }

      try {
        await webpush.sendNotification(
          record.subscription,
          payload,
          { TTL: 60 * 60 }
        );

        sent++;
      } catch (error) {
        failed++;

        if (error.statusCode === 404 || error.statusCode === 410) {
          await redis(['HDEL', STORAGE_KEY, id]);
          removed++;
        }
      }
    }

    return sendJson(res, 200, {
      success: true,
      sent,
      failed,
      removed
    });
  } catch (error) {
    console.error('Notification sending error:', error.message);

    return sendJson(res, 500, {
      success: false,
      error: 'Unable to send notifications.'
    });
  }
};

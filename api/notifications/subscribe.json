'use strict';

const {
  sendJson,
  originAllowed,
  redis,
  redisReady,
  endpointId
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

  if (!['POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'POST, DELETE');
    return sendJson(res, 405, {
      success: false,
      error: 'Method not allowed.'
    });
  }

  if (!redisReady()) {
    return sendJson(res, 503, {
      success: false,
      error: 'Notification storage is not configured.'
    });
  }

  const body = getBody(req);

  if (!body) {
    return sendJson(res, 400, {
      success: false,
      error: 'Invalid request body.'
    });
  }

  try {
    if (req.method === 'DELETE') {
      const endpoint =
        body.endpoint ||
        (body.subscription && body.subscription.endpoint);

      if (
        typeof endpoint !== 'string' ||
        !endpoint.startsWith('https://')
      ) {
        return sendJson(res, 400, {
          success: false,
          error: 'A valid subscription endpoint is required.'
        });
      }

      await redis([
        'HDEL',
        STORAGE_KEY,
        endpointId(endpoint)
      ]);

      return sendJson(res, 200, {
        success: true,
        message: 'Notification subscription removed.'
      });
    }

    const subscription = body.subscription;

    if (
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      !subscription.endpoint.startsWith('https://') ||
      !subscription.keys ||
      typeof subscription.keys.p256dh !== 'string' ||
      typeof subscription.keys.auth !== 'string'
    ) {
      return sendJson(res, 400, {
        success: false,
        error: 'Invalid push subscription.'
      });
    }

    const categories = Array.isArray(body.categories)
      ? [...new Set(body.categories)].filter(category =>
          ALLOWED_CATEGORIES.includes(category)
        )
      : [];

    if (categories.length === 0) {
      return sendJson(res, 400, {
        success: false,
        error: 'Select at least one notification category.'
      });
    }

    const record = {
      subscription: {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime || null,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      categories,
      updatedAt: new Date().toISOString()
    };

    await redis([
      'HSET',
      STORAGE_KEY,
      endpointId(subscription.endpoint),
      JSON.stringify(record)
    ]);

    return sendJson(res, 200, {
      success: true,
      message: 'Notification preferences saved.',
      categories
    });
  } catch (error) {
    console.error('Notification subscription error:', error.message);

    return sendJson(res, 500, {
      success: false,
      error: 'Unable to save notification preferences.'
    });
  }
};

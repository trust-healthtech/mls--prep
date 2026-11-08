# TRUST HEALTH TECH MLS Prep — Push Notifications

This update adds opt-in Web Push subscriptions, background notification display, category preferences, unsubscribe support, and a protected server-side broadcast endpoint.

## Files to place in the GitHub repository

- Replace root `index.html` with this package's `index.html`.
- Replace root `sw.js` with this package's `sw.js`.
- Add `api/notifications/config.js`.
- Add `api/notifications/subscribe.js`.
- Add `api/notifications/send.js`.
- Add `lib/notifications.js`.
- Add `package.json` (if the repository already has one, merge the `web-push` dependency instead of replacing the existing file).

Keep the existing `api/chat.js`, `manifest.json`, images, PDFs, question banks, and other app files unchanged.

## Required server configuration

The app cannot deliver remote notifications until these environment variables are configured in Vercel:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` — use `mailto:trusthealthtech@gmail.com`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `NOTIFICATION_ADMIN_TOKEN` — a long, private random secret
- `ALLOWED_ORIGIN` — `https://mls-prep-one.vercel.app`

### 1. Create VAPID keys

After installing the `web-push` dependency, run this command in a trusted development terminal:

```bash
npx web-push generate-vapid-keys
```

Copy the generated public key into `VAPID_PUBLIC_KEY` and private key into `VAPID_PRIVATE_KEY`. Never put the private key in `index.html`, `sw.js`, GitHub, or any client-side file.

### 2. Configure subscription storage

Create an Upstash Redis database and copy its REST URL and REST token into `KV_REST_API_URL` and `KV_REST_API_TOKEN` in Vercel Environment Variables. The subscription endpoint and encryption keys are stored server-side; they must not be exposed publicly.

### 3. Set the admin secret

Create a long random value for `NOTIFICATION_ADMIN_TOKEN` and save it only in Vercel Environment Variables. Do not share it in public code, screenshots, or chat messages.

### 4. Redeploy

After adding the files and environment variables, redeploy the Vercel project. Users then open the app, choose **Notifications** in the menu, select the categories they want, and enable notifications.

## Sending an update

Send a POST request to `/api/notifications/send` from a trusted admin environment. Example:

```bash
curl -X POST 'https://mls-prep-one.vercel.app/api/notifications/send' \
  -H 'Authorization: Bearer YOUR_PRIVATE_NOTIFICATION_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"category":"materials","title":"New MLS study materials","body":"New study resources are available in the THT Syllabus Hub.","url":"/"}'
```

Allowed `category` values:

- `materials` — new study materials and PDF releases
- `cbt` — CBT and study reminders
- `announcements` — important THT announcements

The API only sends to devices that opted in to the matching category. Expired subscriptions are removed automatically. The admin token is required for sending.

## Important operational note

The sending endpoint supports all three categories, but this update does not invent an automatic timetable or connect itself to a content publishing workflow. New-resource alerts and announcements must be triggered by an authorized THT admin action or a trusted publishing workflow. CBT reminders need a defined schedule and reminder rules before they can be sent automatically.

Push delivery depends on device/browser support, user permission, network availability, and the browser's push service. Test with the installed PWA on Android after deployment. Permission granted alone does not mean a remote notification has been sent.

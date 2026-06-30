# Firebase Realtime Database security

This app uses Firebase Realtime Database for live sync. The database must not be left in test mode with root-level public rules such as:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

## Apply the secure rules

1. Open the app and tap the sync setup button.
2. Copy the value from **Private workspace ID**.
3. Open Firebase Console.
4. Go to **Build > Authentication > Sign-in method** and enable **Anonymous**.
5. Go to **Build > Realtime Database > Rules**.
6. Paste the contents of `firebase-rtdb.rules.json`.
7. Replace `PASTE_YOUR_PRIVATE_WORKSPACE_ID_HERE` with the exact private workspace ID from the app.
8. Publish the rules.

The app now syncs under:

```text
/mep/<private-workspace-id>
```

The root database is denied by default, writes require Firebase Auth, and access is limited to one private workspace ID, so Firebase should stop warning that any user can read or write the entire database.

## Sharing with another device

Use the same Database URL, API Key, Project ID, and Private workspace ID on each device that should share the planner.

Anyone with that workspace ID can access that planner data. For true per-user accounts and invitations, the app would need Firebase Authentication and membership rules.

## Closed-app stock notifications

In-app notifications work while the app is open. Notifications while the home-screen app is closed require Web Push:

1. Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

2. Put the public key into the app's sync setup under **Web Push public key** on each device.
3. Store the private key in Firebase Functions config:

```bash
firebase functions:config:set webpush.public_key="YOUR_PUBLIC_KEY" webpush.private_key="YOUR_PRIVATE_KEY" webpush.email="mailto:you@example.com"
```

4. Deploy the function from the `functions` folder:

```bash
firebase deploy --only functions
```

5. Re-publish `firebase-rtdb.rules.json` so `/mep/<workspace>/pushSubscriptions` is allowed.

The app stores each device's push subscription under the same private workspace. The Cloud Function watches synced stock changes and sends a push when quantity crosses the configured first or second alert threshold.

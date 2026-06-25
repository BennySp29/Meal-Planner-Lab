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

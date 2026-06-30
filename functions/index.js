const functions = require('firebase-functions');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();

function stockAlertLevel(item) {
  if (!item) return 0;
  const qty = Number.parseInt(item.qty, 10) || 0;
  const alert1 = item.alert1 === null || item.alert1 === undefined || item.alert1 === '' ? null : Number.parseInt(item.alert1, 10);
  const alert2 = item.alert2 === null || item.alert2 === undefined || item.alert2 === '' ? null : Number.parseInt(item.alert2, 10);
  if (alert2 !== null && !Number.isNaN(alert2) && qty <= alert2) return 2;
  if (alert1 !== null && !Number.isNaN(alert1) && qty <= alert1) return 1;
  return 0;
}

function stockById(items) {
  const out = {};
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (item && item.id) out[String(item.id)] = item;
  });
  return out;
}

function alertPayload(item, level, workspace) {
  const urgent = level === 2;
  return JSON.stringify({
    title: urgent ? 'Urgent stock alert' : 'Stock running low',
    body: `${item.name} has ${item.qty || 0} left${urgent ? ' (2nd alert)' : ' (1st alert)'}`,
    tag: `stock-${item.id}-${level}`,
    data: {
      url: './index.html?tab=stock',
      workspace,
      stockId: item.id
    }
  });
}

exports.sendStockAlerts = functions.database
  .ref('/mep/{workspace}/state')
  .onWrite(async (change, context) => {
    const publicKey = functions.config().webpush && functions.config().webpush.public_key;
    const privateKey = functions.config().webpush && functions.config().webpush.private_key;
    const email = (functions.config().webpush && functions.config().webpush.email) || 'mailto:alerts@example.com';

    if (!publicKey || !privateKey) {
      console.log('Web Push VAPID keys are not configured.');
      return null;
    }

    webpush.setVapidDetails(email, publicKey, privateKey);

    const before = change.before.exists() ? change.before.val() : {};
    const after = change.after.exists() ? change.after.val() : {};
    const previous = stockById(before.stockItems);
    const current = stockById(after.stockItems);
    const changedBy = after.clientId || '';
    const workspace = context.params.workspace;

    const alerts = Object.keys(current).map((id) => {
      const item = current[id];
      if (!item || !item.notify) return null;
      const level = stockAlertLevel(item);
      const previousLevel = stockAlertLevel(previous[id]);
      if (level > previousLevel) return { item, level };
      return null;
    }).filter(Boolean);

    if (!alerts.length) return null;

    const subsRef = admin.database().ref(`/mep/${workspace}/pushSubscriptions`);
    const snap = await subsRef.once('value');
    const subscriptions = snap.val() || {};
    const removals = [];
    const sends = [];

    Object.keys(subscriptions).forEach((key) => {
      const row = subscriptions[key] || {};
      if (!row.subscription || row.clientId === changedBy) return;

      alerts.forEach((alert) => {
        sends.push(
          webpush.sendNotification(row.subscription, alertPayload(alert.item, alert.level, workspace))
            .catch((error) => {
              if (error && (error.statusCode === 404 || error.statusCode === 410)) {
                removals.push(subsRef.child(key).remove());
                return null;
              }
              console.error('Push send failed', error && (error.statusCode || error.message || error));
              return null;
            })
        );
      });
    });

    await Promise.all(sends);
    await Promise.all(removals);
    return null;
  });

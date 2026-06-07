const supabaseDb = require('../config/supabase');
const { sendEmailNotification, templates } = require('../config/email');

const HR_ROLES = ['super_admin', 'admin', 'hr_manager'];
const REVIEW_ROLES = ['super_admin', 'admin', 'hr_manager', 'manager'];

function uniqueRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    if (!row?.id || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

async function getProfiles({ userIds = [], roles = [], allActive = false } = {}) {
  if (!supabaseDb.enabled) return [];
  const params = [];
  const where = ["status = 'active'"];
  if (allActive) {
    // Keep status-only scope.
  } else {
    const clauses = [];
    if (userIds.length) {
      params.push(userIds);
      clauses.push(`id = any($${params.length}::uuid[])`);
    }
    if (roles.length) {
      params.push(roles);
      clauses.push(`role = any($${params.length}::public.app_role[])`);
    }
    if (!clauses.length) return [];
    where.push(`(${clauses.join(' or ')})`);
  }

  return supabaseDb.queryAll(
    `select id, email, full_name from public.profiles where ${where.join(' and ')}`,
    params,
  );
}

async function getManagerId(employeeId) {
  if (!employeeId || !supabaseDb.enabled) return null;
  const row = await supabaseDb.queryOne('select manager_id from public.profiles where id = $1', [employeeId]);
  return row?.manager_id || null;
}

async function getNotificationPrefs(userIds, event) {
  if (!userIds.length || !event || !supabaseDb.enabled) return new Map();
  const rows = await supabaseDb.queryAll(
    'select employee_id, email, in_app from public.notification_prefs where employee_id = any($1::uuid[]) and event = $2',
    [userIds, event],
  );
  return new Map(rows.map((row) => [row.employee_id, row]));
}

async function notifyProfiles({
  event,
  title,
  message,
  type = 'info',
  link = null,
  userIds = [],
  roles = [],
  allActive = false,
  emailSubject,
  emailHtml,
}) {
  try {
    const recipients = uniqueRows(await getProfiles({ userIds, roles, allActive }));
    const prefs = await getNotificationPrefs(recipients.map((row) => row.id), event);

    for (const recipient of recipients) {
      const pref = prefs.get(recipient.id) || {};
      if (pref.in_app !== false) {
        supabaseDb.query(
          `insert into public.notifications (user_id, title, message, type, link)
           values ($1, $2, $3, $4, $5)`,
          [recipient.id, title, message, type, link],
        ).catch((err) => console.error('[Notification:Supabase] Failed:', err.message));
      }
      if (pref.email !== false && recipient.email && emailSubject && emailHtml) {
        sendEmailNotification(recipient.email, { subject: emailSubject, html: emailHtml });
      }
    }

    return { attempted: recipients.length };
  } catch (err) {
    console.error('[Notification] Failed:', err.message);
    return { attempted: 0, error: err.message };
  }
}

function genericTemplate(title, message) {
  return templates.generic(title, message);
}

module.exports = {
  HR_ROLES,
  REVIEW_ROLES,
  getManagerId,
  notifyProfiles,
  genericTemplate,
};

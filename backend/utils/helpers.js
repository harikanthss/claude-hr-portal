const crypto = require('crypto');
const db = require('../config/database');
const supabaseDb = require('../config/supabase');

const genId = (prefix) => `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

function logAudit(userId, userName, action, resource, resourceId, details, ip) {
  try {
    if (supabaseDb.enabled && isUuid(userId)) {
      supabaseDb.query(
        `
        insert into public.audit_log (actor_id, action, entity, entity_id, diff, ip_address)
        values ($1, $2, $3, $4, $5::jsonb, nullif($6, '')::inet)
        `,
        [
          userId,
          action,
          resource,
          isUuid(resourceId) ? resourceId : null,
          JSON.stringify({ details: details || null, actor_name: userName || null, legacy_resource_id: resourceId || null }),
          isIp(ip) ? ip : '',
        ],
      ).catch((err) => console.error('[Audit:Supabase] Failed to log audit entry:', err.message));
      return;
    }
    db.prepare(
      'INSERT INTO audit_log (id,userId,userName,action,resource,resourceId,details,ipAddress,timestamp) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(genId('audit'), userId, userName, action, resource, resourceId || null, details || null, ip || null, new Date().toISOString());
  } catch (err) {
    console.error('[Audit] Failed to log audit entry:', err.message);
  }
}

function addNotification(title, message, type, userId) {
  try {
    if (supabaseDb.enabled && (!userId || isUuid(userId))) {
      supabaseDb.query(
        `
        insert into public.notifications (user_id, title, message, type)
        values ($1, $2, $3, $4)
        `,
        [userId || null, title, message, type || 'info'],
      ).catch((err) => console.error('[Notification:Supabase] Failed to create notification:', err.message));
      return;
    }
    db.prepare(
      'INSERT INTO notifications (id,title,message,time,type,isRead,userId) VALUES (?,?,?,?,?,0,?)'
    ).run(genId('n'), title, message, new Date().toISOString(), type || 'info', userId || null);
  } catch (err) {
    console.error('[Notification] Failed to create notification:', err.message);
  }
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isIp(value) {
  return typeof value === 'string' && (/^\d{1,3}(\.\d{1,3}){3}$/.test(value) || value.includes(':'));
}

function calcTDS(annualSalary) {
  if (annualSalary <= 300000) return 0;
  if (annualSalary <= 600000) return Math.round((annualSalary - 300000) * 0.05 / 12);
  if (annualSalary <= 900000) return Math.round((15000 + (annualSalary - 600000) * 0.10) / 12);
  if (annualSalary <= 1200000) return Math.round((45000 + (annualSalary - 900000) * 0.15) / 12);
  if (annualSalary <= 1500000) return Math.round((90000 + (annualSalary - 1200000) * 0.20) / 12);
  return Math.round((150000 + (annualSalary - 1500000) * 0.30) / 12);
}

function generatePayslipData(emp) {
  const basic = Math.round(emp.salary * 0.50);
  const hra = Math.round(emp.salary * 0.20);
  const conveyance = 1600;
  const medical = 1250;
  const pf = Math.round(basic * 0.12);
  const tax = calcTDS(emp.salary * 12);
  const esi = emp.salary <= 21000 ? Math.round(emp.salary * 0.0075) : 0;
  const netSalary = basic + hra + conveyance + medical - pf - tax - esi;
  return { basic, hra, conveyance, medical, bonus: 0, pf, tax, esi, netSalary };
}

/**
 * Escape HTML special characters to prevent XSS in rendered HTML.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { genId, logAudit, addNotification, calcTDS, generatePayslipData, escapeHtml };

const crypto = require('crypto');
const db = require('../config/database');

const genId = (p) => `${p}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

function logAudit(userId, userName, action, resource, resourceId, details, ip) {
  try { db.prepare('INSERT INTO audit_log (id,userId,userName,action,resource,resourceId,details,ipAddress,timestamp) VALUES (?,?,?,?,?,?,?,?,?)').run(genId('audit'),userId,userName,action,resource,resourceId||null,details||null,ip||null,new Date().toISOString()); } catch {}
}

function addNotification(title, message, type, userId) {
  try { db.prepare('INSERT INTO notifications (id,title,message,time,type,isRead,userId) VALUES (?,?,?,?,?,0,?)').run(genId('n'),title,message,new Date().toISOString(),type||'info',userId||null); } catch {}
}

function calcTDS(annualSalary) {
  if (annualSalary <= 300000) return 0;
  if (annualSalary <= 600000) return Math.round((annualSalary-300000)*0.05/12);
  if (annualSalary <= 900000) return Math.round((15000+(annualSalary-600000)*0.10)/12);
  if (annualSalary <= 1200000) return Math.round((45000+(annualSalary-900000)*0.15)/12);
  if (annualSalary <= 1500000) return Math.round((90000+(annualSalary-1200000)*0.20)/12);
  return Math.round((150000+(annualSalary-1500000)*0.30)/12);
}

function generatePayslipData(emp) {
  const basic=Math.round(emp.salary*0.50), hra=Math.round(emp.salary*0.20), conveyance=1600, medical=1250;
  const pf=Math.round(basic*0.12), tax=calcTDS(emp.salary*12), esi=emp.salary<=21000?Math.round(emp.salary*0.0075):0;
  return { basic, hra, conveyance, medical, bonus:0, pf, tax, esi, netSalary:basic+hra+conveyance+medical-pf-tax-esi };
}

module.exports = { genId, logAudit, addNotification, calcTDS, generatePayslipData };

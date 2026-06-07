const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireAdminOrHR, isAdminOrHR, scopedEmployeeIds } = require('../middleware/auth');
const { genId, logAudit } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const { sendEmailNotification, templates } = require('../config/email');
const { notifyProfiles, HR_ROLES } = require('../services/notifications');

// ── List documents ────────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      return res.json(await supabaseHr.getDocuments(req.user, req.query));
    }
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    const allowedIds = scopedEmployeeIds(req.user);

    if (req.query.category) {
      sql += ' AND category=?';
      params.push(req.query.category);
    }
    if (allowedIds) {
      if (allowedIds.length === 0) return res.json([]);
      sql += ` AND (employeeId IS NULL OR employeeId IN (${allowedIds.map(() => '?').join(',')}))`;
      params.push(...allowedIds);
    }

    sql += ' ORDER BY uploadedAt DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Upload document ───────────────────────────────────────────────────────────
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const doc = await supabaseHr.createDocument(req.user, req.body, req.file);
      if (doc === false) {
        fs.unlink(req.file.path, () => {});
        return res.status(403).json({ error: 'Access denied' });
      }
      logAudit(req.user.id, req.user.name, 'upload', 'document', doc.id, `Uploaded ${doc.name}`, req.ip);
      const email = templates.documentEvent(doc.name, 'uploaded');
      sendEmailNotification('harikanth.grevya@gmail.com', email);
      await notifyProfiles({ event: 'document_uploaded', title: 'Document uploaded', message: `${doc.name} was uploaded.`, type: 'info', roles: HR_ROLES, emailSubject: email.subject, emailHtml: email.html });
      return res.status(201).json(doc);
    }
    const { name, category, description, employeeId } = req.body;
    const targetEmployeeId = employeeId || req.user.id;
    if (!isAdminOrHR(req.user)) {
      const allowedIds = scopedEmployeeIds(req.user) || [];
      if (!allowedIds.includes(targetEmployeeId)) return res.status(403).json({ error: 'Access denied' });
    }
    const id = genId('doc');
    const filePath = `/uploads/${req.file.filename}`;

    db.prepare(
      'INSERT INTO documents (id,employeeId,name,type,category,filePath,fileSize,uploadedBy,uploadedAt,description) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(
      id,
      targetEmployeeId,
      name || req.file.originalname,
      req.file.mimetype,
      category || 'general',
      filePath,
      req.file.size,
      req.user.name,
      new Date().toISOString(),
      description || ''
    );

    logAudit(req.user.id, req.user.name, 'upload', 'document', id, `Uploaded ${name || req.file.originalname}`, req.ip);
    const doc = db.prepare('SELECT * FROM documents WHERE id=?').get(id);
    sendEmailNotification('harikanth.grevya@gmail.com', templates.documentEvent(doc.name, 'uploaded'));
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete document ───────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const doc = await supabaseHr.deleteDocument(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      const filePath = path.join(__dirname, '../uploads', path.basename(doc.filePath || ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      logAudit(req.user.id, req.user.name, 'delete', 'document', req.params.id, `Deleted ${doc.name}`, req.ip);
      const email = templates.documentEvent(doc.name, 'deleted');
      sendEmailNotification('harikanth.grevya@gmail.com', email);
      await notifyProfiles({ event: 'document_deleted', title: 'Document deleted', message: `${doc.name} was deleted.`, type: 'warning', roles: HR_ROLES, emailSubject: email.subject, emailHtml: email.html });
      return res.json({ message: 'Document deleted' });
    }
    const doc = db.prepare('SELECT * FROM documents WHERE id=?').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Delete the physical file
    const filePath = path.join(__dirname, '../uploads', path.basename(doc.filePath));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM documents WHERE id=?').run(req.params.id);
    logAudit(req.user.id, req.user.name, 'delete', 'document', req.params.id, `Deleted ${doc.name}`, req.ip);
    sendEmailNotification('harikanth.grevya@gmail.com', templates.documentEvent(doc.name, 'deleted'));
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

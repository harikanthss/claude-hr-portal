const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
router.get('/', authenticateToken, (req, res) => { try { res.json(db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email)||{}); } catch(err){res.status(500).json({error:err.message});} });
router.put('/', authenticateToken, (req, res) => { try { const{phone,location,bio}=req.body; db.prepare('UPDATE employees SET phone=COALESCE(?,phone),location=COALESCE(?,location),bio=COALESCE(?,bio) WHERE email=?').run(phone,location,bio,req.user.email); res.json(db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email)); } catch(err){res.status(500).json({error:err.message});} });
router.post('/avatar', authenticateToken, upload.single('avatar'), (req, res) => { if(!req.file) return res.status(400).json({error:'No file'}); try { const url=`/uploads/${req.file.filename}`; db.prepare('UPDATE employees SET avatar=? WHERE email=?').run(url,req.user.email); db.prepare('UPDATE users SET avatar=? WHERE id=?').run(url,req.user.id); res.json({avatarUrl:url}); } catch(err){res.status(500).json({error:err.message});} });
module.exports = router;

require('dotenv').config();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const USE_POSTGRES = !!process.env.DATABASE_URL;

let db;

if (USE_POSTGRES) {
  // ===== POSTGRESQL MODE =====
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

  // Wrap pg pool to match better-sqlite3 API
  db = {
    _pool: pool,
    prepare: (sql) => ({
      run: (...params) => { pool.query(sql.replace(/\?/g, (_, i) => `$${++i}`), params).catch(console.error); return { changes: 1 }; },
      get: (...params) => { throw new Error('Use async queries for PostgreSQL'); },
      all: (...params) => { throw new Error('Use async queries for PostgreSQL'); },
    }),
    // Async versions for PG
    query: (sql, params = []) => pool.query(sql, params),
    queryOne: async (sql, params = []) => { const r = await pool.query(sql, params); return r.rows[0]; },
    queryAll: async (sql, params = []) => { const r = await pool.query(sql, params); return r.rows; },
    isPostgres: true,
  };

  // Init PG tables
  (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'employee', avatar TEXT);
      CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, department TEXT, position TEXT, status TEXT DEFAULT 'active', joinDate TEXT, salary REAL DEFAULT 0, performance INTEGER DEFAULT 0, attendance INTEGER DEFAULT 0, avatar TEXT, phone TEXT, location TEXT, points INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, managerId TEXT, bio TEXT);
      CREATE TABLE IF NOT EXISTS leave_requests (id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, employeeAvatar TEXT, type TEXT, startDate TEXT, endDate TEXT, days INTEGER, reason TEXT, status TEXT DEFAULT 'pending', appliedOn TEXT, approvedBy TEXT, comments TEXT);
      CREATE TABLE IF NOT EXISTS attendance_records (id TEXT PRIMARY KEY, employeeId TEXT NOT NULL, date TEXT NOT NULL, checkIn TEXT, checkOut TEXT, status TEXT DEFAULT 'present', hours REAL DEFAULT 0, UNIQUE(employeeId, date));
      CREATE TABLE IF NOT EXISTS performance_reviews (id TEXT PRIMARY KEY, employeeId TEXT, reviewerId TEXT, period TEXT, technicalScore INTEGER DEFAULT 0, communicationScore INTEGER DEFAULT 0, leadershipScore INTEGER DEFAULT 0, deliveryScore INTEGER DEFAULT 0, innovationScore INTEGER DEFAULT 0, teamworkScore INTEGER DEFAULT 0, overallScore INTEGER DEFAULT 0, comments TEXT, goals TEXT, status TEXT DEFAULT 'draft', createdAt TEXT, updatedAt TEXT);
      CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, employeeAvatar TEXT, category TEXT, amount REAL, description TEXT, date TEXT, status TEXT DEFAULT 'pending', receipt TEXT, submittedOn TEXT, approvedBy TEXT, comments TEXT);
      CREATE TABLE IF NOT EXISTS onboarding_tasks (id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, employeeAvatar TEXT, department TEXT, position TEXT, startDate TEXT, buddy TEXT, taskLabel TEXT, taskDueDay INTEGER DEFAULT 0, taskAssignee TEXT, taskNotes TEXT, done INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY, title TEXT, date TEXT, endDate TEXT, type TEXT DEFAULT 'meeting', color TEXT DEFAULT '#3b82f6', description TEXT, createdBy TEXT);
      CREATE TABLE IF NOT EXISTS payslips (id TEXT PRIMARY KEY, employeeId TEXT, month TEXT, year INTEGER, basicSalary REAL, hra REAL DEFAULT 0, conveyance REAL DEFAULT 0, medical REAL DEFAULT 0, bonus REAL DEFAULT 0, pf REAL DEFAULT 0, tax REAL DEFAULT 0, netSalary REAL, generatedOn TEXT, UNIQUE(employeeId, month, year));
      CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, employeeId TEXT, name TEXT, type TEXT, category TEXT DEFAULT 'general', filePath TEXT, fileSize INTEGER DEFAULT 0, uploadedBy TEXT, uploadedAt TEXT, description TEXT);
      CREATE TABLE IF NOT EXISTS shifts (id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, date TEXT, shiftType TEXT DEFAULT 'general', startTime TEXT, endTime TEXT, status TEXT DEFAULT 'scheduled', notes TEXT, createdBy TEXT);
      CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, userId TEXT, userName TEXT, action TEXT, resource TEXT, resourceId TEXT, details TEXT, ipAddress TEXT, timestamp TEXT);
      CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, title TEXT, message TEXT, time TEXT, type TEXT DEFAULT 'info', isRead INTEGER DEFAULT 0, userId TEXT);
      CREATE TABLE IF NOT EXISTS password_reset_tokens (id TEXT PRIMARY KEY, userId TEXT NOT NULL, token TEXT NOT NULL UNIQUE, expiresAt TEXT NOT NULL, used INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS revoked_tokens (id TEXT PRIMARY KEY, token TEXT NOT NULL, revokedAt TEXT NOT NULL);
    `);
    console.log('PostgreSQL tables ready');
    await seedIfEmpty(db);
  })().catch(console.error);

} else {
  // ===== SQLITE MODE =====
  const Database = require('better-sqlite3');
  const DATA_DIR = path.join(__dirname, 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const sqliteDb = new Database(path.join(DATA_DIR, 'grevya.db'));
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'employee', avatar TEXT);
    CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, department TEXT, position TEXT, status TEXT DEFAULT 'active', joinDate TEXT, salary REAL DEFAULT 0, performance INTEGER DEFAULT 0, attendance INTEGER DEFAULT 0, avatar TEXT, phone TEXT DEFAULT '', location TEXT DEFAULT '', points INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, managerId TEXT, bio TEXT DEFAULT '');
    CREATE TABLE IF NOT EXISTS leave_requests (id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, employeeAvatar TEXT, type TEXT, startDate TEXT, endDate TEXT, days INTEGER, reason TEXT, status TEXT DEFAULT 'pending', appliedOn TEXT, approvedBy TEXT, comments TEXT);
    CREATE TABLE IF NOT EXISTS attendance_records (id TEXT PRIMARY KEY, employeeId TEXT NOT NULL, date TEXT NOT NULL, checkIn TEXT, checkOut TEXT, status TEXT NOT NULL DEFAULT 'present', hours REAL DEFAULT 0, UNIQUE(employeeId, date));
    CREATE TABLE IF NOT EXISTS performance_reviews (id TEXT PRIMARY KEY, employeeId TEXT, reviewerId TEXT, period TEXT, technicalScore INTEGER DEFAULT 0, communicationScore INTEGER DEFAULT 0, leadershipScore INTEGER DEFAULT 0, deliveryScore INTEGER DEFAULT 0, innovationScore INTEGER DEFAULT 0, teamworkScore INTEGER DEFAULT 0, overallScore INTEGER DEFAULT 0, comments TEXT, goals TEXT, status TEXT DEFAULT 'draft', createdAt TEXT, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, employeeAvatar TEXT, category TEXT, amount REAL, description TEXT, date TEXT, status TEXT DEFAULT 'pending', receipt TEXT, submittedOn TEXT, approvedBy TEXT, comments TEXT);
    CREATE TABLE IF NOT EXISTS onboarding_tasks (id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, employeeAvatar TEXT, department TEXT, position TEXT, startDate TEXT, buddy TEXT, taskLabel TEXT, taskDueDay INTEGER DEFAULT 0, taskAssignee TEXT, taskNotes TEXT, done INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY, title TEXT, date TEXT, endDate TEXT, type TEXT DEFAULT 'meeting', color TEXT DEFAULT '#3b82f6', description TEXT, createdBy TEXT);
    CREATE TABLE IF NOT EXISTS payslips (id TEXT PRIMARY KEY, employeeId TEXT, month TEXT, year INTEGER, basicSalary REAL, hra REAL DEFAULT 0, conveyance REAL DEFAULT 0, medical REAL DEFAULT 0, bonus REAL DEFAULT 0, pf REAL DEFAULT 0, tax REAL DEFAULT 0, netSalary REAL, generatedOn TEXT, UNIQUE(employeeId, month, year));
    CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, employeeId TEXT, name TEXT, type TEXT, category TEXT DEFAULT 'general', filePath TEXT, fileSize INTEGER DEFAULT 0, uploadedBy TEXT, uploadedAt TEXT, description TEXT);
    CREATE TABLE IF NOT EXISTS shifts (id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, date TEXT, shiftType TEXT DEFAULT 'general', startTime TEXT, endTime TEXT, status TEXT DEFAULT 'scheduled', notes TEXT, createdBy TEXT);
    CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, userId TEXT, userName TEXT, action TEXT, resource TEXT, resourceId TEXT, details TEXT, ipAddress TEXT, timestamp TEXT);
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, title TEXT, message TEXT, time TEXT, type TEXT DEFAULT 'info', isRead INTEGER DEFAULT 0, userId TEXT);
    CREATE TABLE IF NOT EXISTS password_reset_tokens (id TEXT PRIMARY KEY, userId TEXT NOT NULL, token TEXT NOT NULL UNIQUE, expiresAt TEXT NOT NULL, used INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS revoked_tokens (id TEXT PRIMARY KEY, token TEXT NOT NULL, revokedAt TEXT NOT NULL);
  `);

  // Wrap sqlite to also have async query methods
  db = sqliteDb;
  db.isPostgres = false;
  db.queryOne = (sql, params = []) => Promise.resolve(sqliteDb.prepare(sql).get(...params));
  db.queryAll = (sql, params = []) => Promise.resolve(sqliteDb.prepare(sql).all(...params));
  db.query = (sql, params = []) => Promise.resolve({ rows: sqliteDb.prepare(sql).all(...params) });

  seedIfEmpty(db);
}

async function seedIfEmpty(db) {
  const count = db.isPostgres
    ? (await db.queryOne('SELECT COUNT(*) as count FROM users')).count
    : db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  if (parseInt(count) > 0) return;
  console.log('Seeding database...');

  const hash = (pw) => bcrypt.hashSync(pw, 10);
  const run = (sql, params) => {
    if (db.isPostgres) {
      let i = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++i}`);
      return db._pool.query(pgSql, params);
    } else {
      return db.prepare(sql).run(...params);
    }
  };

  await run('INSERT INTO users (id,name,email,password,role,avatar) VALUES (?,?,?,?,?,?)', ['sys-admin','System Admin','admin@grevya.com',hash('admin123'),'admin','SA']);
  await run('INSERT INTO users (id,name,email,password,role,avatar) VALUES (?,?,?,?,?,?)', ['demo-hr','Divya Kumar','hr@grevya.com',hash('hr123'),'hr_manager','DK']);
  await run('INSERT INTO users (id,name,email,password,role,avatar) VALUES (?,?,?,?,?,?)', ['demo-mgr','Ravi Nair','manager@grevya.com',hash('mgr123'),'manager','RN']);
  await run('INSERT INTO users (id,name,email,password,role,avatar) VALUES (?,?,?,?,?,?)', ['demo-emp','Kiran Patel','employee@grevya.com',hash('emp123'),'employee','KP']);

  const empSql = 'INSERT INTO employees (id,name,email,department,position,status,joinDate,salary,performance,attendance,avatar,phone,location,points,streak,managerId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  const emps = [
    ['e1','Kiran Patel','employee@grevya.com','Engineering','Frontend Developer','active','2022-03-15',85000,92,98,'KP','+91 98765 43210','Bangalore',2840,45,'demo-mgr'],
    ['e2','Sneha Rao','sneha@grevya.com','Design','UX Designer','active','2021-08-10',78000,88,95,'SR','+91 98765 00001','Mumbai',3120,62,'demo-mgr'],
    ['e3','Ravi Nair','manager@grevya.com','Engineering','Engineering Manager','active','2020-01-20',145000,95,99,'RN','+91 98765 00002','Bangalore',4200,90,null],
    ['e4','Divya Kumar','hr@grevya.com','HR','HR Manager','active','2019-11-05',110000,90,96,'DK','+91 98765 00003','Delhi',2680,38,null],
    ['e5','Arjun Mehta','arjun@grevya.com','Sales','Account Executive','on_leave','2023-01-10',65000,75,85,'AM','+91 98765 00004','Mumbai',1620,12,'demo-mgr'],
    ['e6','Priya Sharma','priya@grevya.com','Design','UI/UX Designer','active','2023-01-10',78000,85,91,'PS','+91 65432 10987','Hyderabad',1950,28,'demo-mgr'],
    ['e7','Rahul Gupta','rahul@grevya.com','Finance','Financial Analyst','active','2022-06-01',88000,87,93,'RG','+91 32109 87654','Kolkata',2100,22,'demo-mgr'],
    ['e8','Ananya Singh','ananya@grevya.com','Marketing','Marketing Specialist','active','2023-04-15',70000,83,92,'AS','+91 21098 76543','Bangalore',1780,18,'demo-mgr'],
    ['e9','Vikram Joshi','vikram@grevya.com','Engineering','DevOps Engineer','active','2021-12-01',92000,94,98,'VJ','+91 10987 65432','Hyderabad',3800,75,'demo-mgr'],
    ['e10','Meera Iyer','meera@grevya.com','Operations','Operations Manager','inactive','2020-05-10',98000,76,78,'MI','+91 09876 54321','Mumbai',890,3,'demo-mgr'],
    ['e11','Suresh Pillai','suresh@grevya.com','Sales','Sales Executive','active','2023-07-20',62000,81,89,'SP','+91 98765 12345','Chennai',1340,15,'demo-mgr'],
    ['e12','Pooja Reddy','pooja@grevya.com','Design','Product Designer','active','2022-02-14',81000,90,95,'PR','+91 87654 09876','Pune',2560,41,'demo-mgr'],
  ];
  for (const e of emps) await run(empSql, e);

  const leaveSql = 'INSERT INTO leave_requests (id,employeeId,employeeName,employeeAvatar,type,startDate,endDate,days,reason,status,appliedOn,approvedBy,comments) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)';
  await run(leaveSql, ['l1','e5','Arjun Mehta','AM','sick','2024-03-18','2024-03-22',5,'Fever and flu','pending','2024-03-17',null,null]);
  await run(leaveSql, ['l2','e6','Priya Sharma','PS','casual','2024-03-25','2024-03-26',2,'Family function','approved','2024-03-15','Ravi Nair','Approved!']);
  await run(leaveSql, ['l3','e8','Ananya Singh','AS','annual','2024-04-01','2024-04-07',7,'Annual vacation','pending','2024-03-20',null,null]);
  await run(leaveSql, ['l4','e11','Suresh Pillai','SP','emergency','2024-03-19','2024-03-19',1,'Medical emergency','approved','2024-03-19','Ravi Nair',null]);
  await run(leaveSql, ['l5','e7','Rahul Gupta','RG','casual','2024-03-28','2024-03-29',2,'Personal errands','rejected','2024-03-22','Ravi Nair','Month-end closing.']);
  await run(leaveSql, ['l6','e2','Sneha Rao','SR','annual','2024-04-15','2024-04-20',6,'Vacation','pending','2024-03-25',null,null]);
  await run(leaveSql, ['l7','e12','Pooja Reddy','PR','sick','2024-03-21','2024-03-21',1,'Not feeling well','approved','2024-03-21','Divya Kumar',null]);

  // Seed attendance
  const attSql = 'INSERT OR IGNORE INTO attendance_records (id,employeeId,date,checkIn,checkOut,status,hours) VALUES (?,?,?,?,?,?,?)';
  const empIds = ['e1','e2','e3','e4','e5','e6','e7','e8','e9','e11','e12'];
  for (let day = 1; day <= 30; day++) {
    const dateStr = `2024-03-${String(day).padStart(2,'0')}`;
    const dow = new Date(2024,2,day).getDay();
    for (const empId of empIds) {
      if (dow === 0 || dow === 6) {
        await run(attSql, [`a-${empId}-${day}`,empId,dateStr,'','','holiday',0]);
      } else {
        const rand = Math.random();
        const status = rand < 0.05 ? 'absent' : rand < 0.12 ? 'late' : 'present';
        const hr = 8 + Math.floor(Math.random()*2);
        const mn = Math.floor(Math.random()*60);
        const checkIn = status==='absent'?'':`0${hr}:${String(mn).padStart(2,'0')}`;
        const checkOutHr = 17+Math.floor(Math.random()*3);
        const checkOut = status==='absent'?'':`${checkOutHr}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`;
        const hours = status==='absent'?0:checkOutHr-hr+(Math.random()*0.5);
        await run(attSql, [`a-${empId}-${day}`,empId,dateStr,checkIn,checkOut,status,Math.round(hours*10)/10]);
      }
    }
  }

  // Seed payslips
  const psSql = 'INSERT OR IGNORE INTO payslips (id,employeeId,month,year,basicSalary,hra,conveyance,medical,bonus,pf,tax,netSalary,generatedOn) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)';
  const empSalaries = {e1:85000,e2:78000,e3:145000,e4:110000,e5:65000,e6:78000,e7:88000,e8:70000,e9:92000,e11:62000,e12:81000};
  const months = ['January','February','March'];
  for (let mi=0; mi<months.length; mi++) {
    for (const [empId, sal] of Object.entries(empSalaries)) {
      const basic=Math.round(sal*0.5), hra=Math.round(sal*0.2), conv=1600, med=1250;
      const bonus=mi===2?Math.round(sal*0.05):0, pf=Math.round(basic*0.12), tax=Math.round(sal*0.1);
      const net=basic+hra+conv+med+bonus-pf-tax;
      await run(psSql, [`ps-${empId}-${mi+1}-2024`,empId,months[mi],2024,basic,hra,conv,med,bonus,pf,tax,net,`2024-${String(mi+1).padStart(2,'0')}-28`]);
    }
  }

  // Seed jobs, candidates, expenses, events, notifications, shifts
  await run('INSERT INTO jobs (id,title,department,type,location,openings,posted,status) VALUES (?,?,?,?,?,?,?,?)',['j1','Senior Backend Engineer','Engineering','full_time','Bangalore',2,'2024-03-01','active']);
  await run('INSERT INTO jobs (id,title,department,type,location,openings,posted,status) VALUES (?,?,?,?,?,?,?,?)',['j2','Product Designer','Design','full_time','Remote',1,'2024-03-05','active']);
  await run('INSERT INTO jobs (id,title,department,type,location,openings,posted,status) VALUES (?,?,?,?,?,?,?,?)',['j3','Sales Executive','Sales','full_time','Delhi',3,'2024-03-10','active']);

  await run('INSERT INTO candidates (id,name,email,phone,position,department,stage,appliedDate,avatar,score,note) VALUES (?,?,?,?,?,?,?,?,?,?,?)',['c1','Aditya Verma','aditya@email.com','+91 98700 00001','Senior Backend Engineer','Engineering','interview','2024-03-10','AV',82,'Strong Python skills.']);
  await run('INSERT INTO candidates (id,name,email,phone,position,department,stage,appliedDate,avatar,score,note) VALUES (?,?,?,?,?,?,?,?,?,?,?)',['c2','Neha Joshi','neha@email.com','+91 98700 00004','Senior Backend Engineer','Engineering','offer','2024-03-08','NJ',91,'Excellent candidate.']);

  await run('INSERT INTO expenses (id,employeeId,employeeName,employeeAvatar,category,amount,description,date,status,receipt,submittedOn,approvedBy,comments) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',['ex1','e1','Kiran Patel','KP','Travel',4500,'Cab to client office','2024-03-15','approved',null,'2024-03-16','Divya Kumar',null]);
  await run('INSERT INTO expenses (id,employeeId,employeeName,employeeAvatar,category,amount,description,date,status,receipt,submittedOn,approvedBy,comments) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',['ex2','e5','Arjun Mehta','AM','Software',2999,'JetBrains IDE subscription','2024-03-10','pending',null,'2024-03-12',null,null]);
  await run('INSERT INTO expenses (id,employeeId,employeeName,employeeAvatar,category,amount,description,date,status,receipt,submittedOn,approvedBy,comments) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',['ex3','e9','Vikram Joshi','VJ','Travel',12000,'Flight to Delhi','2024-03-25','pending',null,'2024-03-26',null,null]);

  await run('INSERT INTO calendar_events (id,title,date,endDate,type,color,description,createdBy) VALUES (?,?,?,?,?,?,?,?)',['ev1','Q1 All Hands Meeting','2024-03-28',null,'meeting','#3b82f6','Company-wide all hands','demo-hr']);
  await run('INSERT INTO calendar_events (id,title,date,endDate,type,color,description,createdBy) VALUES (?,?,?,?,?,?,?,?)',['ev2','Q1 Performance Review Deadline','2024-03-31',null,'deadline','#ef4444',null,'demo-hr']);

  await run('INSERT INTO notifications (id,title,message,time,type,isRead,userId) VALUES (?,?,?,?,?,?,?)',['n1','Leave Request Pending','Arjun Mehta applied for sick leave (5 days).','2024-03-17T10:30:00','warning',0,null]);
  await run('INSERT INTO notifications (id,title,message,time,type,isRead,userId) VALUES (?,?,?,?,?,?,?)',['n2','Performance Review Due','Q1 2024 reviews due by March 31st.','2024-03-15T09:00:00','info',0,null]);

  await run('INSERT INTO shifts (id,employeeId,employeeName,date,shiftType,startTime,endTime,status,notes,createdBy) VALUES (?,?,?,?,?,?,?,?,?,?)',['sh1','e1','Kiran Patel','2024-03-25','morning','09:00','17:00','scheduled',null,'demo-hr']);
  await run('INSERT INTO shifts (id,employeeId,employeeName,date,shiftType,startTime,endTime,status,notes,createdBy) VALUES (?,?,?,?,?,?,?,?,?,?)',['sh2','e9','Vikram Joshi','2024-03-25','night','22:00','06:00','scheduled','Server maintenance','demo-mgr']);

  await run('INSERT INTO audit_log (id,userId,userName,action,resource,resourceId,details,ipAddress,timestamp) VALUES (?,?,?,?,?,?,?,?,?)',['audit1','demo-hr','Divya Kumar','create','employee','e11','Created Suresh Pillai','10.0.0.1','2024-03-14T10:00:00']);

  // Onboarding
  const obTasks = [
    {label:'Send welcome email',dueDay:0,assignee:'HR'},{label:'Set up workstation',dueDay:1,assignee:'IT'},
    {label:'Create company email',dueDay:0,assignee:'IT'},{label:'Add to Slack channels',dueDay:1,assignee:'IT'},
    {label:'Introduce to team',dueDay:1,assignee:'Manager'},{label:'Complete HR policy forms',dueDay:2,assignee:'HR'},
    {label:'Submit ID proof documents',dueDay:3,assignee:'Employee'},{label:'Bank account setup',dueDay:3,assignee:'HR'},
    {label:'Security & data privacy training',dueDay:7,assignee:'IT'},{label:'Department tools access',dueDay:2,assignee:'IT'},
    {label:'First 1:1 with manager',dueDay:5,assignee:'Manager'},{label:'Set 30-60-90 day goals',dueDay:7,assignee:'Manager'},
    {label:'Probation period review',dueDay:90,assignee:'HR'},
  ];
  const obEmps = [
    {id:'ob1',name:'Deepak Sharma',avatar:'DS',dept:'Engineering',pos:'Full-stack Developer',start:'2024-04-01',buddy:'Kiran Patel',doneTill:8},
    {id:'ob2',name:'Lavanya Krishnan',avatar:'LK',dept:'Design',pos:'UI Designer',start:'2024-04-08',buddy:'Priya Sharma',doneTill:4},
  ];
  const obSql = 'INSERT INTO onboarding_tasks (id,employeeId,employeeName,employeeAvatar,department,position,startDate,buddy,taskLabel,taskDueDay,taskAssignee,taskNotes,done) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)';
  for (const emp of obEmps) {
    for (let i=0; i<obTasks.length; i++) {
      await run(obSql, [`${emp.id}-t${i}`,emp.id,emp.name,emp.avatar,emp.dept,emp.pos,emp.start,emp.buddy,obTasks[i].label,obTasks[i].dueDay,obTasks[i].assignee,null,i<emp.doneTill?1:0]);
    }
  }

  console.log('Database seeded successfully!');
}

module.exports = db;

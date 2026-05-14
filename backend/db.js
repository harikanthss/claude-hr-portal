const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'grevya.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      position TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      joinDate TEXT NOT NULL,
      salary REAL NOT NULL,
      performance INTEGER NOT NULL DEFAULT 0,
      attendance INTEGER NOT NULL DEFAULT 0,
      avatar TEXT,
      phone TEXT,
      location TEXT,
      points INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      managerId TEXT,
      bio TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      employeeName TEXT NOT NULL,
      employeeAvatar TEXT,
      type TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      days INTEGER NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      appliedOn TEXT NOT NULL,
      approvedBy TEXT,
      comments TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      time TEXT NOT NULL,
      type TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      userId TEXT
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      openings INTEGER NOT NULL,
      posted TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'applied',
      appliedDate TEXT NOT NULL,
      avatar TEXT,
      score INTEGER,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      date TEXT NOT NULL,
      checkIn TEXT,
      checkOut TEXT,
      status TEXT NOT NULL DEFAULT 'present',
      hours REAL DEFAULT 0,
      UNIQUE(employeeId, date)
    );

    CREATE TABLE IF NOT EXISTS performance_reviews (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      reviewerId TEXT NOT NULL,
      period TEXT NOT NULL,
      technicalScore INTEGER DEFAULT 0,
      communicationScore INTEGER DEFAULT 0,
      leadershipScore INTEGER DEFAULT 0,
      deliveryScore INTEGER DEFAULT 0,
      innovationScore INTEGER DEFAULT 0,
      teamworkScore INTEGER DEFAULT 0,
      overallScore INTEGER DEFAULT 0,
      comments TEXT,
      goals TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      employeeName TEXT NOT NULL,
      employeeAvatar TEXT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      receipt TEXT,
      submittedOn TEXT NOT NULL,
      approvedBy TEXT,
      comments TEXT
    );

    CREATE TABLE IF NOT EXISTS onboarding_tasks (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      employeeName TEXT NOT NULL,
      employeeAvatar TEXT,
      department TEXT NOT NULL,
      position TEXT NOT NULL,
      startDate TEXT NOT NULL,
      buddy TEXT,
      taskLabel TEXT NOT NULL,
      taskDueDay INTEGER DEFAULT 0,
      taskAssignee TEXT NOT NULL,
      taskNotes TEXT,
      done INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      endDate TEXT,
      type TEXT NOT NULL DEFAULT 'meeting',
      color TEXT DEFAULT '#3b82f6',
      description TEXT,
      createdBy TEXT
    );

    CREATE TABLE IF NOT EXISTS payslips (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      basicSalary REAL NOT NULL,
      hra REAL DEFAULT 0,
      conveyance REAL DEFAULT 0,
      medical REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      pf REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      netSalary REAL NOT NULL,
      generatedOn TEXT,
      UNIQUE(employeeId, month, year)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      employeeId TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      filePath TEXT NOT NULL,
      fileSize INTEGER DEFAULT 0,
      uploadedBy TEXT NOT NULL,
      uploadedAt TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      employeeName TEXT NOT NULL,
      date TEXT NOT NULL,
      shiftType TEXT NOT NULL DEFAULT 'general',
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      notes TEXT,
      createdBy TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      resourceId TEXT,
      details TEXT,
      ipAddress TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const count = countStmt.get().count;

  if (count === 0) {
    console.log("Seeding initial demo database...");
    const hash = (pw) => bcrypt.hashSync(pw, 10);

    const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)');
    insertUser.run('sys-admin', 'System Admin', 'admin@grevya.com', hash('admin123'), 'admin', 'SA');
    insertUser.run('demo-hr', 'Divya Kumar (HR)', 'hr@grevya.com', hash('hr123'), 'hr_manager', 'DK');
    insertUser.run('demo-mgr', 'Ravi Nair (Manager)', 'manager@grevya.com', hash('mgr123'), 'manager', 'RN');
    insertUser.run('demo-emp', 'Kiran Patel', 'employee@grevya.com', hash('emp123'), 'employee', 'KP');

    const insertEmp = db.prepare(`
      INSERT INTO employees 
      (id, name, email, department, position, status, joinDate, salary, performance, attendance, avatar, phone, location, points, streak, managerId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertEmp.run('e1', 'Kiran Patel', 'employee@grevya.com', 'Engineering', 'Frontend Developer', 'active', '2022-03-15', 85000, 92, 98, 'KP', '+91 98765 43210', 'Bangalore', 2840, 45, 'demo-mgr');
    insertEmp.run('e2', 'Sneha Rao', 'sneha@grevya.com', 'Design', 'UX Designer', 'active', '2021-08-10', 78000, 88, 95, 'SR', '+91 98765 00001', 'Mumbai', 3120, 62, 'demo-mgr');
    insertEmp.run('e3', 'Ravi Nair', 'manager@grevya.com', 'Engineering', 'Engineering Manager', 'active', '2020-01-20', 145000, 95, 99, 'RN', '+91 98765 00002', 'Bangalore', 4200, 90, null);
    insertEmp.run('e4', 'Divya Kumar', 'hr@grevya.com', 'HR', 'HR Manager', 'active', '2019-11-05', 110000, 90, 96, 'DK', '+91 98765 00003', 'Delhi', 2680, 38, null);
    insertEmp.run('e5', 'Arjun Mehta', 'arjun@grevya.com', 'Sales', 'Account Executive', 'on_leave', '2023-01-10', 65000, 75, 85, 'AM', '+91 98765 00004', 'Mumbai', 1620, 12, 'demo-mgr');
    insertEmp.run('e6', 'Priya Sharma', 'priya@grevya.com', 'Design', 'UI/UX Designer', 'active', '2023-01-10', 78000, 85, 91, 'PS', '+91 65432 10987', 'Hyderabad', 1950, 28, 'demo-mgr');
    insertEmp.run('e7', 'Rahul Gupta', 'rahul@grevya.com', 'Finance', 'Financial Analyst', 'active', '2022-06-01', 88000, 87, 93, 'RG', '+91 32109 87654', 'Kolkata', 2100, 22, 'demo-mgr');
    insertEmp.run('e8', 'Ananya Singh', 'ananya@grevya.com', 'Marketing', 'Marketing Specialist', 'active', '2023-04-15', 70000, 83, 92, 'AS', '+91 21098 76543', 'Bangalore', 1780, 18, 'demo-mgr');
    insertEmp.run('e9', 'Vikram Joshi', 'vikram@grevya.com', 'Engineering', 'DevOps Engineer', 'active', '2021-12-01', 92000, 94, 98, 'VJ', '+91 10987 65432', 'Hyderabad', 3800, 75, 'demo-mgr');
    insertEmp.run('e10', 'Meera Iyer', 'meera@grevya.com', 'Operations', 'Operations Manager', 'inactive', '2020-05-10', 98000, 76, 78, 'MI', '+91 09876 54321', 'Mumbai', 890, 3, 'demo-mgr');
    insertEmp.run('e11', 'Suresh Pillai', 'suresh@grevya.com', 'Sales', 'Sales Executive', 'active', '2023-07-20', 62000, 81, 89, 'SP', '+91 98765 12345', 'Chennai', 1340, 15, 'demo-mgr');
    insertEmp.run('e12', 'Pooja Reddy', 'pooja@grevya.com', 'Design', 'Product Designer', 'active', '2022-02-14', 81000, 90, 95, 'PR', '+91 87654 09876', 'Pune', 2560, 41, 'demo-mgr');

    const insertLeave = db.prepare('INSERT INTO leave_requests (id, employeeId, employeeName, employeeAvatar, type, startDate, endDate, days, reason, status, appliedOn, approvedBy, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertLeave.run('l1', 'e5', 'Arjun Mehta', 'AM', 'sick', '2024-03-18', '2024-03-22', 5, 'Fever and flu, doctor recommended rest', 'pending', '2024-03-17', null, null);
    insertLeave.run('l2', 'e6', 'Priya Sharma', 'PS', 'casual', '2024-03-25', '2024-03-26', 2, 'Family function and travel', 'approved', '2024-03-15', 'Ravi Nair', 'Approved. Enjoy!');
    insertLeave.run('l3', 'e8', 'Ananya Singh', 'AS', 'annual', '2024-04-01', '2024-04-07', 7, 'Annual vacation with family', 'pending', '2024-03-20', null, null);
    insertLeave.run('l4', 'e11', 'Suresh Pillai', 'SP', 'emergency', '2024-03-19', '2024-03-19', 1, 'Medical emergency in family', 'approved', '2024-03-19', 'Kiran Patel', null);
    insertLeave.run('l5', 'e7', 'Rahul Gupta', 'RG', 'casual', '2024-03-28', '2024-03-29', 2, 'Personal errands', 'rejected', '2024-03-22', 'Ravi Nair', 'Month-end closing. Cannot be approved.');
    insertLeave.run('l6', 'e2', 'Sneha Rao', 'SR', 'annual', '2024-04-15', '2024-04-20', 6, 'Vacation', 'pending', '2024-03-25', null, null);
    insertLeave.run('l7', 'e12', 'Pooja Reddy', 'PR', 'sick', '2024-03-21', '2024-03-21', 1, 'Not feeling well', 'approved', '2024-03-21', 'Divya Kumar', null);

    const insertJob = db.prepare('INSERT INTO jobs (id, title, department, type, location, openings, posted, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertJob.run('j1', 'Senior Backend Engineer', 'Engineering', 'full_time', 'Bangalore', 2, '2024-03-01', 'active');
    insertJob.run('j2', 'Product Designer', 'Design', 'full_time', 'Remote', 1, '2024-03-05', 'active');
    insertJob.run('j3', 'Sales Executive', 'Sales', 'full_time', 'Delhi', 3, '2024-03-10', 'active');
    insertJob.run('j4', 'Content Strategist', 'Content', 'part_time', 'Mumbai', 1, '2024-02-20', 'paused');

    const insertCandidate = db.prepare('INSERT INTO candidates (id, name, email, phone, position, department, stage, appliedDate, avatar, score, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertCandidate.run('c1', 'Aditya Verma', 'aditya@email.com', '+91 98700 00001', 'Senior Backend Engineer', 'Engineering', 'interview', '2024-03-10', 'AV', 82, 'Strong Python skills.');
    insertCandidate.run('c2', 'Ritika Shah', 'ritika@email.com', '+91 98700 00002', 'Product Designer', 'Design', 'screening', '2024-03-12', 'RS', 75, null);
    insertCandidate.run('c3', 'Manish Tiwari', 'manish@email.com', '+91 98700 00003', 'Sales Executive', 'Sales', 'applied', '2024-03-15', 'MT', null, null);
    insertCandidate.run('c4', 'Neha Joshi', 'neha@email.com', '+91 98700 00004', 'Senior Backend Engineer', 'Engineering', 'offer', '2024-03-08', 'NJ', 91, 'Excellent candidate. Offer sent.');
    insertCandidate.run('c5', 'Sameer Kulkarni', 'sameer@email.com', '+91 98700 00005', 'Sales Executive', 'Sales', 'applied', '2024-03-16', 'SK', null, null);

    // Seed attendance records
    const insertAttendance = db.prepare('INSERT INTO attendance_records (id, employeeId, date, checkIn, checkOut, status, hours) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const employees = ['e1','e2','e3','e4','e5','e6','e7','e8','e9','e11','e12'];
    for (let day = 1; day <= 30; day++) {
      const dateStr = `2024-03-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(2024, 2, day).getDay();
      employees.forEach((empId, idx) => {
        const isSunday = dayOfWeek === 0;
        const isSaturday = dayOfWeek === 6;
        if (isSunday || isSaturday) {
          insertAttendance.run(`a-${empId}-${day}`, empId, dateStr, '', '', 'holiday', 0);
        } else {
          const rand = Math.random();
          const status = rand < 0.05 ? 'absent' : rand < 0.12 ? 'late' : 'present';
          const hr = 8 + Math.floor(Math.random() * 2);
          const mn = Math.floor(Math.random() * 60);
          const checkIn = status === 'absent' ? '' : `0${hr}:${String(mn).padStart(2, '0')}`;
          const checkOutHr = 17 + Math.floor(Math.random() * 3);
          const checkOut = status === 'absent' ? '' : `${checkOutHr}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
          const hours = status === 'absent' ? 0 : checkOutHr - hr + (Math.random() * 0.5);
          insertAttendance.run(`a-${empId}-${day}`, empId, dateStr, checkIn, checkOut, status, Math.round(hours * 10) / 10);
        }
      });
    }

    // Seed expenses
    const insertExpense = db.prepare('INSERT INTO expenses (id, employeeId, employeeName, employeeAvatar, category, amount, description, date, status, receipt, submittedOn, approvedBy, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertExpense.run('ex1', 'e1', 'Kiran Patel', 'KP', 'Travel', 4500, 'Cab to client office (Whitefield)', '2024-03-15', 'approved', null, '2024-03-16', 'Divya Kumar', null);
    insertExpense.run('ex2', 'e5', 'Arjun Mehta', 'AM', 'Software', 2999, 'JetBrains IDE annual subscription', '2024-03-10', 'pending', null, '2024-03-12', null, null);
    insertExpense.run('ex3', 'e2', 'Sneha Rao', 'SR', 'Training', 8000, 'Content strategy certification course', '2024-03-08', 'approved', null, '2024-03-09', 'Ravi Nair', null);
    insertExpense.run('ex4', 'e8', 'Ananya Singh', 'AS', 'Food & Entertainment', 3200, 'Team lunch with clients', '2024-03-20', 'pending', null, '2024-03-21', null, null);
    insertExpense.run('ex5', 'e9', 'Vikram Joshi', 'VJ', 'Office Supplies', 1450, 'USB-C hub and cables', '2024-03-05', 'rejected', null, '2024-03-06', 'Divya Kumar', 'Use company procurement portal.');
    insertExpense.run('ex6', 'e7', 'Rahul Gupta', 'RG', 'Travel', 12000, 'Flight to Delhi for client meeting', '2024-03-25', 'pending', null, '2024-03-26', null, null);

    // Seed payslips
    const insertPayslip = db.prepare('INSERT INTO payslips (id, employeeId, month, year, basicSalary, hra, conveyance, medical, bonus, pf, tax, netSalary, generatedOn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const empSalaries = {
      e1: 85000, e2: 78000, e3: 145000, e4: 110000, e5: 65000,
      e6: 78000, e7: 88000, e8: 70000, e9: 92000, e11: 62000, e12: 81000
    };
    const months = ['January','February','March'];
    months.forEach((m, mi) => {
      Object.entries(empSalaries).forEach(([empId, sal]) => {
        const basic = Math.round(sal * 0.5);
        const hra = Math.round(sal * 0.2);
        const conv = 1600;
        const med = 1250;
        const bonus = mi === 2 ? Math.round(sal * 0.05) : 0;
        const pf = Math.round(basic * 0.12);
        const tax = Math.round(sal * 0.1);
        const net = basic + hra + conv + med + bonus - pf - tax;
        insertPayslip.run(`ps-${empId}-${mi+1}-2024`, empId, m, 2024, basic, hra, conv, med, bonus, pf, tax, net, `2024-${String(mi+1).padStart(2,'0')}-28`);
      });
    });

    // Seed onboarding
    const insertOnboarding = db.prepare('INSERT INTO onboarding_tasks (id, employeeId, employeeName, employeeAvatar, department, position, startDate, buddy, taskLabel, taskDueDay, taskAssignee, taskNotes, done) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const defaultTasks = [
      { label: 'Send welcome email with portal credentials', dueDay: 0, assignee: 'HR', notes: 'Include login link and first-day instructions' },
      { label: 'Set up workstation & equipment', dueDay: 1, assignee: 'IT', notes: null },
      { label: 'Create company email account', dueDay: 0, assignee: 'IT', notes: null },
      { label: 'Add to all relevant Slack channels', dueDay: 1, assignee: 'IT', notes: null },
      { label: 'Introduce to team & assign buddy', dueDay: 1, assignee: 'Manager', notes: null },
      { label: 'Complete HR policy & compliance forms', dueDay: 2, assignee: 'HR', notes: null },
      { label: 'Submit ID & address proof documents', dueDay: 3, assignee: 'Employee', notes: null },
      { label: 'Bank account setup for salary', dueDay: 3, assignee: 'HR', notes: null },
      { label: 'Complete security & data privacy training', dueDay: 7, assignee: 'IT', notes: null },
      { label: 'Department tools & software access', dueDay: 2, assignee: 'IT', notes: null },
      { label: 'First 1:1 meeting with manager', dueDay: 5, assignee: 'Manager', notes: null },
      { label: 'Set 30-60-90 day goals', dueDay: 7, assignee: 'Manager', notes: null },
      { label: 'Complete probation period review', dueDay: 90, assignee: 'HR', notes: 'Schedule formal review at end of 90 days' },
    ];
    const onboardingEmps = [
      { id: 'ob1', name: 'Deepak Sharma', avatar: 'DS', dept: 'Engineering', pos: 'Full-stack Developer', start: '2024-04-01', buddy: 'Kiran Patel', doneTill: 8 },
      { id: 'ob2', name: 'Lavanya Krishnan', avatar: 'LK', dept: 'Design', pos: 'UI Designer', start: '2024-04-08', buddy: 'Priya Sharma', doneTill: 4 },
      { id: 'ob3', name: 'Mohit Bansal', avatar: 'MB', dept: 'Sales', pos: 'Sales Executive', start: '2024-04-15', buddy: 'Ravi Nair', doneTill: 0 },
    ];
    onboardingEmps.forEach(emp => {
      defaultTasks.forEach((task, i) => {
        insertOnboarding.run(`${emp.id}-t${i}`, emp.id, emp.name, emp.avatar, emp.dept, emp.pos, emp.start, emp.buddy, task.label, task.dueDay, task.assignee, task.notes, i < emp.doneTill ? 1 : 0);
      });
    });

    // Seed calendar events
    const insertEvent = db.prepare('INSERT INTO calendar_events (id, title, date, endDate, type, color, description, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertEvent.run('ev1', 'Q1 All Hands Meeting', '2024-03-28', null, 'meeting', '#3b82f6', 'Company-wide all hands', 'demo-hr');
    insertEvent.run('ev2', 'Engineering Retrospective', '2024-04-05', null, 'meeting', '#3b82f6', null, 'demo-mgr');
    insertEvent.run('ev3', 'HR Policy Training', '2024-04-12', null, 'training', '#8b5cf6', null, 'demo-hr');
    insertEvent.run('ev4', 'Sales Target Review', '2024-04-22', null, 'meeting', '#3b82f6', null, 'demo-mgr');
    insertEvent.run('ev5', 'Q1 Performance Review Deadline', '2024-03-31', null, 'deadline', '#ef4444', null, 'demo-hr');

    // Seed notifications
    const insertNotif = db.prepare('INSERT INTO notifications (id, title, message, time, type, isRead, userId) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertNotif.run('n1', 'Leave Request Pending', 'Arjun Mehta has applied for sick leave (5 days).', '2024-03-17T10:30:00', 'warning', 0, null);
    insertNotif.run('n2', 'Performance Review Due', 'Q1 2024 performance reviews are due by March 31st.', '2024-03-15T09:00:00', 'info', 0, null);
    insertNotif.run('n3', 'New Employee Onboarded', 'Suresh Pillai completed onboarding.', '2024-03-14T14:20:00', 'success', 1, null);
    insertNotif.run('n4', 'Attendance Alert', 'Meera Iyer attendance dropped below 80%.', '2024-03-13T11:00:00', 'error', 1, null);

    // Seed shifts
    const insertShift = db.prepare('INSERT INTO shifts (id, employeeId, employeeName, date, shiftType, startTime, endTime, status, notes, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertShift.run('sh1', 'e1', 'Kiran Patel', '2024-03-25', 'morning', '09:00', '17:00', 'scheduled', null, 'demo-hr');
    insertShift.run('sh2', 'e2', 'Sneha Rao', '2024-03-25', 'morning', '09:00', '17:00', 'scheduled', null, 'demo-hr');
    insertShift.run('sh3', 'e9', 'Vikram Joshi', '2024-03-25', 'night', '22:00', '06:00', 'scheduled', 'Server maintenance window', 'demo-mgr');
    insertShift.run('sh4', 'e1', 'Kiran Patel', '2024-03-26', 'morning', '09:00', '17:00', 'scheduled', null, 'demo-hr');
    insertShift.run('sh5', 'e5', 'Arjun Mehta', '2024-03-26', 'afternoon', '13:00', '21:00', 'scheduled', null, 'demo-hr');

    // Seed audit log
    const insertAudit = db.prepare('INSERT INTO audit_log (id, userId, userName, action, resource, resourceId, details, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertAudit.run('audit1', 'demo-hr', 'Divya Kumar (HR)', 'create', 'employee', 'e11', 'Created employee Suresh Pillai', '10.0.0.1', '2024-03-14T10:00:00');
    insertAudit.run('audit2', 'demo-mgr', 'Ravi Nair (Manager)', 'approve', 'leave_request', 'l2', 'Approved leave for Priya Sharma', '10.0.0.2', '2024-03-15T14:30:00');
    insertAudit.run('audit3', 'demo-hr', 'Divya Kumar (HR)', 'update', 'employee', 'e10', 'Changed status to inactive for Meera Iyer', '10.0.0.1', '2024-03-16T09:00:00');

    console.log("Database seeded successfully!");
  }
}

initDb();

module.exports = db;

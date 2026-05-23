export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str}"`
          : str;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportEmployees(employees: any[]) {
  downloadCSV('employees', employees.map(e => ({
    Name: e.name,
    Email: e.email,
    Department: e.department,
    Position: e.position,
    Status: e.status,
    'Join Date': e.joinDate,
    Salary: e.salary,
    Performance: e.performance,
    Attendance: e.attendance,
    Points: e.points,
    Phone: e.phone,
    Location: e.location,
  })));
}

export function exportAttendance(records: any[]) {
  downloadCSV('attendance', records.map(r => ({
    'Employee ID': r.employeeId,
    Date: r.date,
    'Check In': r.checkIn || '—',
    'Check Out': r.checkOut || '—',
    Status: r.status,
    Hours: r.hours,
  })));
}

export function exportPayslips(payslips: any[], employees: any[]) {
  downloadCSV('payslips', payslips.map(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    return {
      Employee: emp?.name || p.employeeId,
      Department: emp?.department || '',
      Month: p.month,
      Year: p.year,
      'Basic Salary': p.basicSalary,
      HRA: p.hra,
      Conveyance: p.conveyance,
      Medical: p.medical,
      Bonus: p.bonus,
      'PF Deduction': p.pf,
      'TDS': p.tax,
      'Net Salary': p.netSalary,
    };
  }));
}

export function exportLeaves(leaves: any[]) {
  downloadCSV('leave-requests', leaves.map(l => ({
    Employee: l.employeeName,
    Type: l.type,
    'Start Date': l.startDate,
    'End Date': l.endDate,
    Days: l.days,
    Reason: l.reason,
    Status: l.status,
    'Approved By': l.approvedBy || '—',
    'Applied On': l.appliedOn?.split('T')[0],
  })));
}

# Final Browser QA Checklist

Use this checklist after starting the backend and frontend with real Supabase Auth configuration.

## Auth

1. Open `http://localhost:5173`.
   - Expected: landing/login page loads without console errors.

2. Login as `harikanth.grevya@gmail.com`.
   - Expected: dashboard opens, role is `super_admin`, sidebar is visible, Access Requests is visible.

3. Refresh the browser.
   - Expected: session persists and dashboard remains open.

4. Logout.
   - Expected: Supabase session clears, local app state clears, user returns to login/landing page.

5. Google login as `harikanth.grevya@gmail.com`.
   - Expected: dashboard opens as `super_admin`; no duplicate profile is created.

6. Unknown Google account.
   - Expected: Access Pending page appears, no dashboard/sidebar/module access.

7. Email Request Access.
   - Steps: click Request Access, enter full name, email, optional phone/message, submit.
   - Expected: Access Pending page appears, request is stored as `status=pending`, `role=null`, admin email notification is received.

8. Access Requests queue.
   - Expected: new pending request appears without requiring a manual page reload.

9. Approve pending user.
   - Steps: select role, department, job title, and manager when applicable.
   - Expected: profile becomes `active`, selected role is saved, approval/setup email is sent.

10. Approved user login.
    - Expected: dashboard opens with selected role, no Access Pending or Account Not Found message.

11. Reject pending user.
    - Expected: profile becomes `rejected`, rejection email is sent, login shows Access Denied and no portal access.

## RBAC

1. `super_admin`
   - Expected: full access, including Access Requests and role assignment.

2. `admin`
   - Expected: full HR access; cannot access founder-only controls if present.

3. `hr_manager`
   - Expected: HR-wide operational access; cannot assign `super_admin`.

4. `manager`
   - Expected: direct reports only for employees, leave, attendance, performance, shifts, onboarding, and expenses.

5. `employee`
   - Expected: self-only access; no HR/admin pages.

## Privacy

1. Employee salary isolation.
   - Expected: employee cannot see salary for other employees in Employees, Profile, Reports, API responses, or exported CSV.

2. Payroll isolation.
   - Expected: employee sees own payslips only; manager cannot see org/team payroll.

3. Performance isolation.
   - Expected: employee sees own performance only; manager sees direct reports only.

4. Documents isolation.
   - Expected: employee sees own/global documents only; manager sees own/direct report/global documents only.

5. Unauthorized direct API calls.
   - Expected: calls outside role scope return `403`, `404`, or an empty scoped result; no private rows leak.

## Page Regression

1. Add Employee.
   - Expected: modal opens near top/center, page does not jump, mobile modal scrolls internally.

2. Salary input.
   - Expected: numeric only, minimum `0`, saved as a number.

3. Employee creation.
   - Expected: new employee appears immediately after successful persistence; no fake success toast.

4. CSV exports.
   - Pages: Employees, Leave, Attendance, Payroll/Payslips, Performance, Recruitment, Documents, Expenses, Shifts, Calendar, Reports, Budget, Compliance.
   - Expected: exports current filtered visible data, clean headers, empty-state toast when no data.

5. Onboarding.
   - Expected: opens inside SPA, no reload instruction page, task updates persist.

6. Leave.
   - Expected: apply works, manager/HR approval scope is enforced, notifications appear.

7. Attendance.
   - Expected: view works, check-in/check-out work, regularization and WFH requests notify approvers and employee on decision.

8. Payroll.
   - Expected: scoped view works; payroll run creates payslip notifications.

9. Performance.
   - Expected: review creation works only for allowed scope.

10. Recruitment.
    - Expected: candidate stage changes and hired status notify HR/Admin/Manager audience.

11. Documents.
    - Expected: upload/delete work, unauthorized target employee upload is blocked.

12. Expenses.
    - Expected: submit/approve/reject work and notifications are created.

13. Calendar.
    - Expected: event creation works for HR/Admin and notifies intended users.

14. Notifications.
    - Expected: notification list loads, mark read, mark all read, and delete work.

15. Access Requests.
    - Expected: approve/reject updates UI immediately without reload.

## Responsive

1. Mobile width.
   - Expected: drawer navigation, no horizontal overflow, tables scroll horizontally.

2. Tablet width.
   - Expected: adaptive sidebar/drawer behavior, controls do not overlap.

3. Laptop width.
   - Expected: sidebar and topbar visible, active item highlighted.

4. Desktop width.
   - Expected: layout uses available space without stretched or overlapping content.

## Console And Network

1. Browser console.
   - Expected: no uncaught runtime errors.

2. Network tab.
   - Expected: no repeated failed auth loops, no raw Supabase JSON error pages, no unexpected `401/403` for allowed actions.

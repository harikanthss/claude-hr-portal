import { create } from 'zustand';
import { User, Employee, LeaveRequest, Notification } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

interface AppState {
  currentUser: User | null;
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  notifications: Notification[];
  darkMode: boolean;
  sidebarOpen: boolean;
  
  fetchInitialData: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  approveLeave: (id: string, comments?: string) => Promise<void>;
  rejectLeave: (id: string, comments?: string) => Promise<void>;
  applyLeave: (request: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn'>) => Promise<void>;
  
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  employees: [],
  leaveRequests: [],
  notifications: [],
  darkMode: false,
  sidebarOpen: true,

  fetchInitialData: async () => {
    try {
      const [empRes, leaveRes, notifRes] = await Promise.all([
        fetch(`${API_URL}/employees`, { headers: getHeaders() }),
        fetch(`${API_URL}/leave-requests`, { headers: getHeaders() }),
        fetch(`${API_URL}/notifications`, { headers: getHeaders() })
      ]);
      const employees = await empRes.json();
      const leaveRequests = await leaveRes.json();
      const notifications = await notifRes.json();
      set({ employees: Array.isArray(employees) ? employees : [], leaveRequests: Array.isArray(leaveRequests) ? leaveRequests : [], notifications: Array.isArray(notifications) ? notifications : [] });
    } catch (e) {
      console.error(e);
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        set({ currentUser: data.user as User });
        await get().fetchInitialData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ currentUser: null, employees: [], leaveRequests: [], notifications: [] });
  },

  toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  addEmployee: async (emp) => {
    const res = await fetch(`${API_URL}/employees`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(emp)
    });
    if (res.ok) {
      const newEmp = await res.json();
      set(s => ({ employees: [...s.employees, newEmp] }));
    }
  },

  updateEmployee: async (id, data) => {
    const existing = get().employees.find(e => e.id === id);
    const merged = { ...existing, ...data };
    const res = await fetch(`${API_URL}/employees/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(merged)
    });
    if (res.ok) {
      const updEmp = await res.json();
      set(s => ({ employees: s.employees.map(e => e.id === id ? updEmp : e) }));
    }
  },

  deleteEmployee: async (id) => {
    const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (res.ok) set(s => ({ employees: s.employees.filter(e => e.id !== id) }));
  },

  approveLeave: async (id, comments) => {
    const user = get().currentUser;
    const req = { status: 'approved', approvedBy: user?.name, comments };
    const res = await fetch(`${API_URL}/leave-requests/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(req)
    });
    if (res.ok) {
      const upd = await res.json();
      set(s => ({ leaveRequests: s.leaveRequests.map(r => r.id === id ? upd : r) }));
    }
  },

  rejectLeave: async (id, comments) => {
    const user = get().currentUser;
    const req = { status: 'rejected', approvedBy: user?.name, comments };
    const res = await fetch(`${API_URL}/leave-requests/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(req)
    });
    if (res.ok) {
      const upd = await res.json();
      set(s => ({ leaveRequests: s.leaveRequests.map(r => r.id === id ? upd : r) }));
    }
  },

  applyLeave: async (request) => {
    const req = { ...request, status: 'pending', appliedOn: new Date().toISOString().split('T')[0] };
    const res = await fetch(`${API_URL}/leave-requests`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(req)
    });
    if (res.ok) {
      const upd = await res.json();
      set(s => ({ leaveRequests: [upd, ...s.leaveRequests] }));
    }
  },

  markNotificationRead: async (id) => {
    await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT', headers: getHeaders() });
    set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
  },

  markAllRead: async () => {
    await fetch(`${API_URL}/notifications/mark-all-read`, { method: 'PUT', headers: getHeaders() });
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) }));
  },
}));

// API helper for pages that manage their own state
export const api = {
  get: async (path: string) => {
    const res = await fetch(`${API_URL}${path}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  post: async (path: string, body: any) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  put: async (path: string, body: any) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  del: async (path: string) => {
    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers: getHeaders() });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  upload: async (path: string, formData: FormData) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST', headers: authHeaders(), body: formData
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
};

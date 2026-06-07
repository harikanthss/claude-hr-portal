import { create } from 'zustand';
import { User, Employee, LeaveRequest, Notification, UserRole } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const allowDemoAuth = import.meta.env.DEV && import.meta.env.VITE_ALLOW_DEMO_AUTH === 'true';

export type LoginResult = { ok: true } | { ok: false; message: string; pending?: boolean; denied?: boolean };
export type AccessRequestInput = { name: string; email: string; phone?: string; message?: string };

const getAccessToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || localStorage.getItem('token') || '';
  if (session?.access_token) localStorage.setItem('token', session.access_token);
  return token;
};

const getHeaders = async () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${await getAccessToken()}`
});

const authHeaders = async () => ({
  'Authorization': `Bearer ${await getAccessToken()}`
});

/**
 * Handle API responses — auto-logout on 401 (token expired/revoked).
 */
async function handleResponse(res: Response) {
  if (res.status === 401) {
    // Token expired or revoked — force logout
    localStorage.removeItem('token');
    useStore.setState({
      currentUser: null,
      employees: [],
      leaveRequests: [],
      notifications: [],
    });
    throw new Error('Session expired. Please login again.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(data.error || `API error: ${res.status}`);
  }
  return res.json();
}

async function createPendingAccessRequest(accessToken: string) {
  const res = await fetch(`${API_URL}/access/pending`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(data.error || 'Unable to request access.');
  }
  return res.json();
}

async function fetchProfileById(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*, departments:department_id(id, name)')
    .eq('id', userId)
    .maybeSingle();
  return data as Profile | null;
}

async function fetchProfileByEmail(email: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*, departments:department_id(id, name)')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  return data as Profile | null;
}

async function resolveSessionProfile(session: { access_token: string; user: { id: string; email?: string | null } }) {
  let profileRow = await fetchProfileById(session.user.id);
  if (!profileRow && session.user.email) profileRow = await fetchProfileByEmail(session.user.email);
  if (profileRow?.status === 'active' && profileRow.role) return profileRow;

  const pending = await createPendingAccessRequest(session.access_token);
  if (pending?.status === 'active') {
    let approvedProfile = pending.profile?.id ? await fetchProfileById(pending.profile.id) : null;
    if (!approvedProfile && pending.profile?.email) approvedProfile = await fetchProfileByEmail(pending.profile.email);
    if (!approvedProfile && session.user.email) approvedProfile = await fetchProfileByEmail(session.user.email);
    return approvedProfile || (pending.profile as Profile | undefined) || null;
  }

  return (pending?.profile as Profile | undefined) || profileRow || null;
}

async function getAccessStatusByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;
  const res = await fetch(`${API_URL}/access/status?email=${encodeURIComponent(normalizedEmail)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.error || 'Unable to check access status.');
  return data as { status: 'active' | 'pending' | 'rejected' | 'missing'; message: string };
}

function accessMessage(profile: Profile | null) {
  if (profile?.status === 'rejected') return 'Access rejected. Contact HR.';
  return 'Your account is not yet approved. Contact HR.';
}

interface AppState {
  currentUser: User | null;
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  notifications: Notification[];
  darkMode: boolean;
  sidebarOpen: boolean;
  loading: boolean;
  authStatus: 'idle' | 'checking' | 'authenticated' | 'pending' | 'denied';
  authMessage: string;
  
  initializeAuth: () => Promise<void>;
  fetchInitialData: () => Promise<void>;
  login: (email: string, password: string) => Promise<LoginResult>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<LoginResult>;
  requestAccess: (input: AccessRequestInput) => Promise<LoginResult>;
  logout: () => Promise<void>;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
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
  darkMode: localStorage.getItem('darkMode') === 'true',
  sidebarOpen: typeof window === 'undefined' ? true : window.innerWidth > 900,
  loading: false,
  authStatus: 'checking',
  authMessage: '',

  initializeAuth: async () => {
    set({ authStatus: 'checking', authMessage: '' });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      const token = localStorage.getItem('token');
      if (!token || isSupabaseConfigured) {
        if (token && isSupabaseConfigured) localStorage.removeItem('token');
        set({ authStatus: 'idle' });
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) {
          localStorage.removeItem('token');
          return;
        }

        const user = await res.json();
        set({ currentUser: legacyUserToUser(user) });
        await get().fetchInitialData();
        set({ authStatus: 'authenticated', authMessage: '' });
      } catch {
        localStorage.removeItem('token');
        set({ authStatus: 'idle' });
      }
      return;
    }

    localStorage.setItem('token', session.access_token);
    const profileRow = await resolveSessionProfile(session);
    if (!profileRow || profileRow.status !== 'active' || !profileRow.role) {
      set({
        currentUser: null,
        employees: [],
        leaveRequests: [],
        notifications: [],
        authStatus: profileRow?.status === 'rejected' ? 'denied' : 'pending',
        authMessage: accessMessage(profileRow),
      });
      return;
    }

    set({ currentUser: profileToUser(profileRow) });
    await get().fetchInitialData();
    set({ authStatus: 'authenticated', authMessage: '' });
  },

  fetchInitialData: async () => {
    set({ loading: true });
    try {
      const headers = await getHeaders();
      const [empRes, leaveRes, notifRes] = await Promise.all([
        fetch(`${API_URL}/employees`, { headers }),
        fetch(`${API_URL}/leave-requests`, { headers }),
        fetch(`${API_URL}/notifications`, { headers })
      ]);
      const employees = await handleResponse(empRes);
      const leaveRequests = await handleResponse(leaveRes);
      const notifications = await handleResponse(notifRes);
      set({
        employees: Array.isArray(employees) ? employees : [],
        leaveRequests: Array.isArray(leaveRequests) ? leaveRequests : [],
        notifications: Array.isArray(notifications) ? notifications : [],
      });
    } catch (e) {
      console.error('[Store] fetchInitialData error:', e);
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (!error && authData.session?.user) {
        localStorage.setItem('token', authData.session.access_token);
        const profileRow = await resolveSessionProfile(authData.session);
        if (!profileRow || profileRow.status !== 'active' || !profileRow.role) {
          const message = accessMessage(profileRow);
          const denied = profileRow?.status === 'rejected';
          set({
            currentUser: null,
            employees: [],
            leaveRequests: [],
            notifications: [],
            authStatus: denied ? 'denied' : 'pending',
            authMessage: message,
          });
          return {
            ok: false,
            message,
            pending: true,
            denied,
          };
        }

        set({ currentUser: profileToUser(profileRow) });
        await get().fetchInitialData();
        set({ authStatus: 'authenticated', authMessage: '' });
        return { ok: true };
      }

      if (isSupabaseConfigured && !allowDemoAuth) {
        const status = await getAccessStatusByEmail(normalizedEmail).catch(() => null);
        if (status?.status === 'active') return { ok: false, message: status.message };
        if (status?.status === 'pending') {
          set({ authStatus: 'pending', authMessage: status.message });
          return { ok: false, message: status.message, pending: true };
        }
        if (status?.status === 'rejected') {
          set({ authStatus: 'denied', authMessage: status.message });
          return { ok: false, message: status.message, denied: true };
        }
        return {
          ok: false,
          message: error?.message?.toLowerCase().includes('invalid login credentials')
            ? 'Account not found or password is incorrect. Request access from HR if this is your first time.'
            : error?.message || 'Unable to sign in. Request access from HR if this is your first time.',
        };
      }

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      if (!res.ok) return { ok: false, message: 'Invalid email or password.' };

      const data = await res.json();
      localStorage.setItem('token', data.token);
      set({ currentUser: legacyUserToUser(data.user) });
      await get().fetchInitialData();
      set({ authStatus: 'authenticated', authMessage: '' });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Unable to sign in. Please try again.' };
    }
  },

  signInWithOAuth: async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) return { ok: false, message: error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : `Unable to continue with ${provider}.` };
    }
  },

  requestAccess: async (input) => {
    try {
      const normalizedInput = { ...input, email: input.email.trim().toLowerCase(), name: input.name.trim() };
      const res = await fetch(`${API_URL}/access/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedInput),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const denied = data.status === 'rejected';
        const message = import.meta.env.DEV && data.detail
          ? `${data.error || 'Unable to request access.'}: ${data.detail}`
          : data.error || (denied ? 'Access rejected. Contact HR.' : 'Unable to request access.');
        set({ authStatus: denied ? 'denied' : 'idle', authMessage: message });
        return { ok: false, message, denied };
      }
      if (data.status === 'active') {
        return { ok: false, message: data.message || 'Your account is already approved. Please check your email to set your password or use Forgot password.' };
      }
      const message = 'Access pending approval.';
      set({
        currentUser: null,
        employees: [],
        leaveRequests: [],
        notifications: [],
        authStatus: 'pending',
        authMessage: message,
      });
      return { ok: false, message, pending: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Unable to request access.' };
    }
  },

  logout: async () => {
    // Call backend logout to revoke token
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: await getHeaders(),
      }).catch(() => {}); // Fire and forget
    }
    supabase.auth.signOut().catch(() => {});
    localStorage.removeItem('token');
    set({ currentUser: null, employees: [], leaveRequests: [], notifications: [], authStatus: 'idle', authMessage: '' });
  },

  toggleDarkMode: () => set(s => {
    const next = !s.darkMode;
    localStorage.setItem('darkMode', String(next));
    return { darkMode: next };
  }),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addEmployee: async (emp) => {
    const res = await fetch(`${API_URL}/employees`, {
      method: 'POST', headers: await getHeaders(), body: JSON.stringify(emp)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to add employee.' }));
      throw new Error(data.error || 'Failed to add employee.');
    }
    const created = await res.json();
    const fullRes = await fetch(`${API_URL}/employees/${created.id}`, { headers: await getHeaders() });
    if (fullRes.ok) {
      const fullEmp = await fullRes.json();
      set(s => ({ employees: [fullEmp, ...s.employees.filter(e => e.id !== fullEmp.id)] }));
      return;
    }
    const allRes = await fetch(`${API_URL}/employees`, { headers: await getHeaders() });
    if (!allRes.ok) throw new Error('Employee was created, but the list could not refresh.');
    const all = await allRes.json();
    set({ employees: Array.isArray(all) ? all : [] });
  },

  updateEmployee: async (id, data) => {
    const existing = get().employees.find(e => e.id === id);
    const merged = { ...existing, ...data };
    const res = await fetch(`${API_URL}/employees/${id}`, {
      method: 'PUT', headers: await getHeaders(), body: JSON.stringify(merged)
    });
    if (res.ok) {
      const updEmp = await res.json();
      set(s => ({ employees: s.employees.map(e => e.id === id ? updEmp : e) }));
    }
  },

  deleteEmployee: async (id) => {
    const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE', headers: await getHeaders() });
    if (res.ok) set(s => ({ employees: s.employees.filter(e => e.id !== id) }));
  },

  approveLeave: async (id, comments) => {
    const user = get().currentUser;
    const res = await fetch(`${API_URL}/leave-requests/${id}`, {
      method: 'PUT', headers: await getHeaders(),
      body: JSON.stringify({ status: 'approved', comments })
    });
    if (res.ok) {
      set(s => ({ leaveRequests: s.leaveRequests.map(r =>
        r.id === id ? { ...r, status: 'approved' as const, approvedBy: user?.name || '', comments: comments || '' } : r
      )}));
    }
  },

  rejectLeave: async (id, comments) => {
    const user = get().currentUser;
    const res = await fetch(`${API_URL}/leave-requests/${id}`, {
      method: 'PUT', headers: await getHeaders(),
      body: JSON.stringify({ status: 'rejected', comments })
    });
    if (res.ok) {
      set(s => ({ leaveRequests: s.leaveRequests.map(r =>
        r.id === id ? { ...r, status: 'rejected' as const, approvedBy: user?.name || '', comments: comments || '' } : r
      )}));
    }
  },

  applyLeave: async (request) => {
    const req = { ...request, status: 'pending', appliedOn: new Date().toISOString() };
    const res = await fetch(`${API_URL}/leave-requests`, {
      method: 'POST', headers: await getHeaders(), body: JSON.stringify(req)
    });
    if (res.ok) {
      const created = await res.json();
      const newLeave: LeaveRequest = {
        ...req,
        id: created.id || Date.now().toString(),
        status: 'pending',
      } as LeaveRequest;
      set(s => ({ leaveRequests: [newLeave, ...s.leaveRequests] }));
    }
  },

  markNotificationRead: async (id) => {
    await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT', headers: await getHeaders() });
    set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true, isRead: true } : n) }));
  },

  markAllRead: async () => {
    await fetch(`${API_URL}/notifications/mark-all-read`, { method: 'PUT', headers: await getHeaders() });
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true, isRead: true })) }));
  },
}));

function profileToUser(profile: Profile): User {
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role as UserRole,
    department: profile.department?.name || '',
    position: profile.job_title || '',
    avatar: profile.avatar || '',
    joinDate: profile.hire_date || '',
    managerId: profile.manager_id || undefined,
  };
}

function legacyUserToUser(user: Partial<User>): User {
  return {
    id: user.id || '',
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'employee',
    department: user.department || '',
    position: user.position || '',
    avatar: user.avatar || '',
    joinDate: user.joinDate || '',
    managerId: user.managerId,
  };
}

// API helper for pages that manage their own state
export const api = {
  get: async (path: string) => {
    const res = await fetch(`${API_URL}${path}`, { headers: await getHeaders() });
    return handleResponse(res);
  },
  post: async (path: string, body: unknown) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST', headers: await getHeaders(), body: JSON.stringify(body)
    });
    return handleResponse(res);
  },
  put: async (path: string, body: unknown) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT', headers: await getHeaders(), body: JSON.stringify(body)
    });
    return handleResponse(res);
  },
  del: async (path: string) => {
    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers: await getHeaders() });
    return handleResponse(res);
  },
  upload: async (path: string, formData: FormData) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST', headers: await authHeaders(), body: formData
    });
    return handleResponse(res);
  }
};

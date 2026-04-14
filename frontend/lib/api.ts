/**
 * API Service Layer for Logistics ERP
 * All endpoints are database-ready and accept environment variable API_BASE_URL
 * No mock data - everything connects to backend
 */

import * as Types from '@/types/logistics';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// --- Production: Response cache ---
interface CacheEntry { data: any; expiry: number; }
const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<any>>();
const CACHE_TTL = 30_000; // 30 seconds default

function getCached(key: string): any | null {
  const entry = responseCache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data;
  if (entry) responseCache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttl = CACHE_TTL) {
  responseCache.set(key, { data, expiry: Date.now() + ttl });
  // Evict old entries if cache grows too large
  if (responseCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of responseCache) { if (v.expiry < now) responseCache.delete(k); }
  }
}

function invalidateCache(pattern?: string) {
  if (!pattern) { responseCache.clear(); return; }
  for (const key of responseCache.keys()) { if (key.includes(pattern)) responseCache.delete(key); }
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }
    return response.json();
  }

  // --- Production: Fetch with retry + dedup + cache ---
  private async fetchWithCache<T>(url: string, options?: RequestInit & { cacheTTL?: number; skipCache?: boolean }): Promise<T> {
    const method = options?.method?.toUpperCase() || 'GET';
    const cacheKey = `${method}:${url}`;

    // Only cache GET requests
    if (method === 'GET' && !options?.skipCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached as T;

      // Dedup: if same request is in-flight, return its promise
      if (inflightRequests.has(cacheKey)) return inflightRequests.get(cacheKey)! as Promise<T>;
    }

    const doFetch = async (): Promise<T> => {
      let lastError: Error | null = null;
      const maxRetries = method === 'GET' ? 3 : 1;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(url, { ...options, headers: options?.headers || this.getHeaders() });

          if (response.status >= 500 && attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
            continue;
          }

          let result: T;
          try {
            result = await this.handleResponse<T>(response);
          } catch (respErr: any) {
            if (response.status === 401 && !url.includes('/auth/') && typeof window !== 'undefined') {
              const refreshToken = localStorage.getItem('refresh_token');
              if (refreshToken) {
                if (!this.isRefreshing) {
                  this.isRefreshing = true;
                  this.refreshPromise = fetch(`${this.baseUrl}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken })
                  }).then(res => res.json()).then(data => {
                    if (data.success && data.data?.token) {
                      this.token = data.data.token;
                      localStorage.setItem('auth_token', data.data.token);
                      return data.data.token;
                    }
                    throw new Error('Refresh failed');
                  }).catch(() => {
                    this.token = null;
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/auth/login';
                    throw new Error('Session expired');
                  }).finally(() => {
                    this.isRefreshing = false;
                    this.refreshPromise = null;
                  });
                }

                if (this.refreshPromise) {
                  await this.refreshPromise;
                  // Retry the original request with the new token
                  const retryResponse = await fetch(url, { ...options, headers: this.getHeaders() });
                  result = await this.handleResponse<T>(retryResponse);
                } else {
                  throw respErr;
                }
              } else {
                // No refresh token available, redirect to login
                this.token = null;
                localStorage.removeItem('auth_token');
                window.location.href = '/auth/login';
                throw respErr;
              }
            } else {
              throw respErr;
            }
          }

          // Cache successful GET responses
          if (method === 'GET') setCache(cacheKey, result, options?.cacheTTL || CACHE_TTL);

          return result;
        } catch (err: any) {
          lastError = err;
          if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
        }
      }
      throw lastError || new Error('Request failed');
    };

    if (method === 'GET') {
      const promise = doFetch().finally(() => inflightRequests.delete(cacheKey));
      inflightRequests.set(cacheKey, promise);
      return promise;
    }

    // Mutations invalidate related cache
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const segment = url.split('/api/')[1]?.split('/')[0] || '';
      invalidateCache(segment);
    }

    return doFetch();
  }

  // ==================== AUTHENTICATION ====================
  async signup(email: string, password: string, name: string, branch_id: string, role?: string): Promise<Types.AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password, name, branch_id: branch_id === 'none' ? '' : branch_id, role }),
      });
      const json = await this.handleResponse<{ success: boolean; data: Types.AuthResponse }>(response);
      const data = json.data || json as unknown as Types.AuthResponse;
      this.token = data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
      }
      return data;
    } catch (error) {
      throw new Error('Signup failed. Please try again.');
    }
  }


  async login(email: string, password: string, portal: 'staff' | 'customer' = 'staff'): Promise<Types.AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password, portal }),
      });
      const json = await this.handleResponse<{ success: boolean; data: Types.AuthResponse }>(response);
      const data = json.data || json as unknown as Types.AuthResponse;
      this.token = data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
      }
      return data;
    } catch (error) {
      throw new Error('Authentication failed. Please check your credentials or ensure the API is running.');
    }
  }


  async logout(): Promise<void> {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }


  async getCurrentUser(): Promise<Types.User> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const json = await this.handleResponse<{ success: boolean; data: Types.User }>(response);
      return json.data || json as unknown as Types.User;
    } catch (error) {
      throw new Error('Failed to fetch current user');
    }
  }

  // ==================== DASHBOARD ====================
  async getDashboardStats(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/dashboard/stats`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  // ==================== NOTIFICATIONS ====================
  async getNotifications(limit: number = 20): Promise<{ notifications: any[], unreadCount: number }> {
    const response = await fetch(`${this.baseUrl}/notifications?limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async markNotificationsAsRead(notificationIds?: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/notifications/read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ notificationIds }),
    });
    return this.handleResponse(response);
  }

  // ==================== SHIPMENTS ====================
  async createShipment(data: Types.BookingFormData): Promise<Types.Shipment> {
    const response = await fetch(`${this.baseUrl}/shipments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.Shipment>(response);
  }

  async getShipment(shipmentId: string): Promise<Types.Shipment> {
    const response = await fetch(`${this.baseUrl}/shipments/${shipmentId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.Shipment>(response);
  }

  async getShipmentByHAWB(hawb: string): Promise<Types.Shipment> {
    const response = await fetch(`${this.baseUrl}/shipments/hawb/${hawb}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.Shipment>(response);
  }

  async listShipments(filters?: Types.ShipmentFilters): Promise<Types.PaginatedResponse<Types.Shipment>> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${this.baseUrl}/shipments?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.PaginatedResponse<Types.Shipment>>(response);
  }

  async updateShipment(shipmentId: string, data: Partial<Types.Shipment>): Promise<Types.Shipment> {
    const response = await fetch(`${this.baseUrl}/shipments/${shipmentId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.Shipment>(response);
  }

  // ==================== TRACKING ====================
  async quickTracking(query: Types.QuickTrackingQuery): Promise<Types.TrackingResponse> {
    const queryString = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) queryString.append(key, value);
    });
    const response = await fetch(`${this.baseUrl}/tracking/quick?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.TrackingResponse>(response);
  }

  async getTrackingDetails(shipmentId: string): Promise<Types.TrackingResponse> {
    const response = await fetch(`${this.baseUrl}/tracking/${shipmentId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.TrackingResponse>(response);
  }

  async createTrackingEvent(shipmentId: string, data: Partial<Types.TrackingEvent>): Promise<Types.TrackingEvent> {
    const response = await fetch(`${this.baseUrl}/tracking/${shipmentId}/events`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.TrackingEvent>(response);
  }

  // ==================== OPERATIONS ====================
  async updateOperationStatus(data: Types.StatusUpdateFormData): Promise<Types.OperationStatusUpdate> {
    const response = await fetch(`${this.baseUrl}/operations/status-update`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.OperationStatusUpdate>(response);
  }

  async getOperationHistory(shipmentId: string): Promise<Types.OperationStatusUpdate[]> {
    const response = await fetch(`${this.baseUrl}/operations/history/${shipmentId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.OperationStatusUpdate[]>(response);
  }

  // ==================== POD (PROOF OF DELIVERY) ====================
  async createPOD(data: Types.PODFormData): Promise<Types.POD> {
    const response = await fetch(`${this.baseUrl}/pod`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.POD>(response);
  }

  async getPOD(shipmentId: string): Promise<Types.POD> {
    const response = await fetch(`${this.baseUrl}/pod/${shipmentId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.POD>(response);
  }

  async listPODs(filters?: { page?: number; limit?: number }): Promise<any> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${this.baseUrl}/pod?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async uploadPODFiles(shipmentId: string, files: FormData): Promise<Types.PODUpload> {
    const response = await fetch(`${this.baseUrl}/pod/upload/${shipmentId}`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: files,
    });
    return this.handleResponse<Types.PODUpload>(response);
  }

  // ==================== DOCUMENTS ====================
  async listDocuments(filters?: { document_type?: string; search?: string; page?: number; limit?: number }): Promise<any> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${this.baseUrl}/documents/list?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async uploadDocument(shipmentId: string, documentType: Types.DocumentType, file: File): Promise<Types.Document> {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/documents/${shipmentId}`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
    return this.handleResponse<Types.Document>(response);
  }

  async getShipmentDocuments(shipmentId: string): Promise<Types.Document[]> {
    const response = await fetch(`${this.baseUrl}/documents/${shipmentId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.Document[]>(response);
  }

  // ==================== AUDIT ====================
  async getAuditDashboard(): Promise<Types.AuditDashboard> {
    const response = await fetch(`${this.baseUrl}/audit/dashboard`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.AuditDashboard>(response);
  }

  async listHAWBAudits(filters?: { status?: string; page?: number; limit?: number }): Promise<Types.PaginatedResponse<Types.HAWBAudit>> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${this.baseUrl}/audit/hawbs?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.PaginatedResponse<Types.HAWBAudit>>(response);
  }

  async createAudit(hawb: string, data: Partial<Types.HAWBAudit>): Promise<Types.HAWBAudit> {
    const response = await fetch(`${this.baseUrl}/audit/hawbs/${hawb}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.HAWBAudit>(response);
  }

  // ==================== BILLING & INVOICES ====================
  async calculateCharges(shipmentId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/billing/calculate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ shipment_id: shipmentId }),
    });
    return this.handleResponse<any>(response);
  }

  async downloadInvoicePDF(invoiceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/billing/invoices/${invoiceId}/pdf`, {
      method: 'GET',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      // Try to get error message
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to download PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  async createInvoice(shipmentIds: string[]): Promise<Types.Invoice> {
    const response = await fetch(`${this.baseUrl}/invoices`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ shipment_ids: shipmentIds }),
    });
    return this.handleResponse<Types.Invoice>(response);
  }

  async listInvoices(filters?: { status?: string; page?: number; limit?: number }): Promise<Types.PaginatedResponse<Types.Invoice>> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${this.baseUrl}/invoices?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.PaginatedResponse<Types.Invoice>>(response);
  }

  async getInvoice(invoiceId: string): Promise<Types.Invoice> {
    const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.Invoice>(response);
  }

  // ==================== BRANCHES ====================
  async getBranches(): Promise<Types.Branch[]> {
    try {
      const response = await fetch(`${this.baseUrl}/branches`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const json = await this.handleResponse<any>(response);
      // Backend wraps as { data: { data: [...], total, page, limit } }
      if (json.data && Array.isArray(json.data)) return json.data;
      if (json.data && json.data.data && Array.isArray(json.data.data)) return json.data.data;
      return [];
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      return [];
    }
  }


  async getBranch(branchId: string): Promise<Types.Branch> {
    const response = await fetch(`${this.baseUrl}/branches/${branchId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.Branch>(response);
  }

  // ==================== PARTIES (Shippers/Consignees) ====================
  async createParty(data: Types.Party): Promise<Types.Party> {
    const response = await fetch(`${this.baseUrl}/parties`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.Party>(response);
  }

  async listParties(filters?: { role?: 'shipper' | 'consignee'; search?: string; page?: number; limit?: number }): Promise<Types.PaginatedResponse<Types.Party>> {
    try {
      const queryString = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryString.append(key, String(value));
          }
        });
      }
      const response = await fetch(`${this.baseUrl}/parties?${queryString.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse<Types.PaginatedResponse<Types.Party>>(response);
    } catch (error) {
      console.error('Failed to fetch parties:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  }


  async getParty(partyId: string): Promise<Types.Party> {
    const response = await fetch(`${this.baseUrl}/parties/${partyId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.Party>(response);
  }

  // ==================== USERS ====================
  async listUsers(filters?: { role?: string; page?: number; limit?: number }): Promise<Types.PaginatedResponse<Types.User>> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${this.baseUrl}/users?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.PaginatedResponse<Types.User>>(response);
  }

  async createUser(data: Partial<Types.User> & { password: string }): Promise<Types.User> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.User>(response);
  }

  async updateUser(userId: string, data: Partial<Types.User>): Promise<Types.User> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.User>(response);
  }

  // ==================== E-WAY BILLS ====================
  async createEWayBill(data: Types.EWayBillFormData): Promise<Types.EWayBill> {
    const response = await fetch(`${this.baseUrl}/eway-bills`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.EWayBill>(response);
  }

  async listEWayBills(filters?: { status?: string; page?: number; limit?: number }): Promise<Types.PaginatedResponse<Types.EWayBill>> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${this.baseUrl}/eway-bills?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.PaginatedResponse<Types.EWayBill>>(response);
  }

  async getEWayBill(ewayBillId: string): Promise<Types.EWayBill> {
    const response = await fetch(`${this.baseUrl}/eway-bills/${ewayBillId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.EWayBill>(response);
  }

  async updateEWayBill(ewayBillId: string, data: Partial<Types.EWayBill>): Promise<Types.EWayBill> {
    const response = await fetch(`${this.baseUrl}/eway-bills/${ewayBillId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.EWayBill>(response);
  }

  async cancelEWayBill(ewayBillId: string, reason: string): Promise<Types.EWayBill> {
    const response = await fetch(`${this.baseUrl}/eway-bills/${ewayBillId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return this.handleResponse<Types.EWayBill>(response);
  }

  // ==================== DRIVER ASSIGNMENTS ====================
  async assignShipmentToDriver(shipmentId: string, driverId: string): Promise<Types.DriverAssignment> {
    const response = await fetch(`${this.baseUrl}/driver-assignments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ shipment_id: shipmentId, driver_id: driverId }),
    });
    return this.handleResponse<Types.DriverAssignment>(response);
  }

  async listDriverAssignments(driverId?: string, status?: string): Promise<Types.DriverAssignment[]> {
    const queryString = new URLSearchParams();
    if (driverId) queryString.append('driver_id', driverId);
    if (status) queryString.append('status', status);

    const response = await fetch(`${this.baseUrl}/driver-assignments?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Types.DriverAssignment[]>(response);
  }

  async updateAssignmentStatus(assignmentId: string, status: string, location?: string): Promise<Types.DriverAssignment> {
    const response = await fetch(`${this.baseUrl}/driver-assignments/${assignmentId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, location }),
    });
    return this.handleResponse<Types.DriverAssignment>(response);
  }

  async completeAssignment(assignmentId: string, data: Partial<Types.DriverAssignment>): Promise<Types.DriverAssignment> {
    const response = await fetch(`${this.baseUrl}/driver-assignments/${assignmentId}/complete`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Types.DriverAssignment>(response);
  }

  // ==================== RATE SHEETS ====================
  async uploadRateSheet(data: FormData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/rate-sheets/upload`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: data,
    });
    return this.handleResponse<any>(response);
  }

  // ==================== EMPLOYEES ====================
  async listEmployees(filters?: { branch_id?: string; department?: string; status?: string; search?: string }): Promise<any> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryString.append(key, String(value));
      });
    }
    const response = await fetch(`${this.baseUrl}/employees?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  // ==================== MANIFESTS ====================
  async listManifests(filters?: any): Promise<any> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryString.append(key, String(value));
      });
    }
    const response = await fetch(`${this.baseUrl}/manifests?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async createManifest(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/manifests`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  async dispatchManifest(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/manifests/${id}/dispatch`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async receiveManifest(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/manifests/${id}/receive`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  // ==================== DRS ====================
  async listDRS(filters?: any): Promise<any> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryString.append(key, String(value));
      });
    }
    const response = await fetch(`${this.baseUrl}/drs?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async createDRS(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/drs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  async markDRSOut(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/drs/${id}/out-for-delivery`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  // ==================== DUTY BILLS ====================
  async listDutyBills(filters?: any): Promise<any> {
    const queryString = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryString.append(key, String(value));
      });
    }
    const response = await fetch(`${this.baseUrl}/duty-bills?${queryString.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async createDutyBill(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/duty-bills`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  async getDutyBill(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/duty-bills/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  // ==================== REPORTS ====================
  async getDashboard(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/reports/dashboard`, { method: 'GET', headers: this.getHeaders() });
    return this.handleResponse<any>(response);
  }

  async getShipmentReports(filters?: any): Promise<any> {
    const q = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) q.append(k, String(v)); });
    const response = await fetch(`${this.baseUrl}/reports/shipments?${q}`, { method: 'GET', headers: this.getHeaders() });
    return this.handleResponse<any>(response);
  }

  async getBillingReports(filters?: any): Promise<any> {
    const q = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) q.append(k, String(v)); });
    const response = await fetch(`${this.baseUrl}/reports/billing?${q}`, { method: 'GET', headers: this.getHeaders() });
    return this.handleResponse<any>(response);
  }

  async getRevenueReports(filters?: any): Promise<any> {
    const q = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) q.append(k, String(v)); });
    const response = await fetch(`${this.baseUrl}/reports/revenue?${q}`, { method: 'GET', headers: this.getHeaders() });
    return this.handleResponse<any>(response);
  }

  async getPerformanceReports(filters?: any): Promise<any> {
    const q = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) q.append(k, String(v)); });
    const response = await fetch(`${this.baseUrl}/reports/performance?${q}`, { method: 'GET', headers: this.getHeaders() });
    return this.handleResponse<any>(response);
  }

  // ==================== VALIDATION ====================
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validateHAWB(hawb: string): boolean {
    return hawb.length >= 3 && hawb.length <= 20;
  }

  private validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  }

  // ==================== UTILITY ====================
  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Advanced error handling with specific error types
   */
  getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return 'Unauthorized. Please login again.';
      }
      if (error.message.includes('403')) {
        return 'You do not have permission to access this resource.';
      }
      if (error.message.includes('404')) {
        return 'The requested resource was not found.';
      }
      if (error.message.includes('500')) {
        return 'Server error. Please try again later.';
      }
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

// Export singleton instance
export const apiService = new ApiService();

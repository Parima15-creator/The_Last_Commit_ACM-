/**
 * Frontend API Service communicating with JholFree backend proxy (/api)
 */

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data && data.error ? data.error : `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Bills
  getBills: () => request('/bills'),
  getBill: (id) => request(`/bills/${id}`),
  createBill: (billData) => request('/bills', {
    method: 'POST',
    body: JSON.stringify(billData),
  }),
  updateBill: (id, updates) => request(`/bills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteBill: (id) => request(`/bills/${id}`, {
    method: 'DELETE',
  }),
  splitBill: (id, splitData) => request(`/bills/${id}/split`, {
    method: 'POST',
    body: JSON.stringify(splitData),
  }),

  // Contacts
  getContacts: () => request('/contacts'),
  createContact: (contactData) => request('/contacts', {
    method: 'POST',
    body: JSON.stringify(contactData),
  }),
  updateContact: (id, updates) => request(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteContact: (id) => request(`/contacts/${id}`, {
    method: 'DELETE',
  }),
  getContactHistory: (id) => request(`/contacts/${id}/history`),

  // Payments
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payments${query ? `?${query}` : ''}`);
  },
  updatePaymentStatus: (id, status) => request(`/payments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  getPaymentShare: (id) => request(`/payments/${id}/share`),

  // AI & Groq Vision Proxy
  extractReceipt: (imageBase64, mimeType = 'image/jpeg') => request('/ai/extract-receipt', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, mimeType }),
  }),
  voiceSplit: (transcript, items, userName) => request('/ai/voice-split', {
    method: 'POST',
    body: JSON.stringify({ transcript, items, userName }),
  }),
  getAiHealth: () => request('/ai/health'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settingsData) => request('/settings', {
    method: 'POST',
    body: JSON.stringify(settingsData),
  }),
};

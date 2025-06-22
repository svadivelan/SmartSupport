const API_BASE_URL = 'https://0vhlizcpnxvz.manus.space/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async register(name, email, password, role = 'End-User') {
    return this.request('/auth/register', {
      method: 'POST',
      body: { name, email, password, role },
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Tickets
  async getTickets(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tickets${queryString ? `?${queryString}` : ''}`);
  }

  async getTicket(id) {
    return this.request(`/tickets/${id}`);
  }

  async createTicket(ticketData) {
    return this.request('/tickets', {
      method: 'POST',
      body: ticketData,
    });
  }

  async updateTicket(id, ticketData) {
    return this.request(`/tickets/${id}`, {
      method: 'PUT',
      body: ticketData,
    });
  }

  async addComment(ticketId, commentData) {
    return this.request(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: commentData,
    });
  }

  async getTicketStats() {
    return this.request('/tickets/stats');
  }

  // Admin endpoints
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async updateUser(id, userData) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: userData,
    });
  }

  async deleteUser(id) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getTicketStatuses() {
    return this.request('/admin/ticket-statuses');
  }

  async createTicketStatus(statusData) {
    return this.request('/admin/ticket-statuses', {
      method: 'POST',
      body: statusData,
    });
  }

  async updateTicketStatus(id, statusData) {
    return this.request(`/admin/ticket-statuses/${id}`, {
      method: 'PUT',
      body: statusData,
    });
  }

  async deleteTicketStatus(id) {
    return this.request(`/admin/ticket-statuses/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories() {
    return this.request('/admin/categories');
  }

  async createCategory(categoryData) {
    return this.request('/admin/categories', {
      method: 'POST',
      body: categoryData,
    });
  }

  async updateCategory(id, categoryData) {
    return this.request(`/admin/categories/${id}`, {
      method: 'PUT',
      body: categoryData,
    });
  }

  async deleteCategory(id) {
    return this.request(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async getSLAPolicies() {
    return this.request('/admin/sla-policies');
  }

  async createSLAPolicy(policyData) {
    return this.request('/admin/sla-policies', {
      method: 'POST',
      body: policyData,
    });
  }

  async updateSLAPolicy(id, policyData) {
    return this.request(`/admin/sla-policies/${id}`, {
      method: 'PUT',
      body: policyData,
    });
  }
}

export default new ApiService();


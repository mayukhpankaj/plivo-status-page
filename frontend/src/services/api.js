const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  getAuthHeaders() {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }

  async getOrganizations() {
    return this.request('/api/organizations', {
      headers: this.getAuthHeaders(),
    });
  }

  async createOrganization(data) {
    return this.request('/api/organizations', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async getOrganization(orgId) {
    return this.request(`/api/organizations/${orgId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async updateOrganization(orgId, data) {
    return this.request(`/api/organizations/${orgId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deleteOrganization(orgId) {
    return this.request(`/api/organizations/${orgId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async getMembers(orgId) {
    return this.request(`/api/organizations/${orgId}/members`, {
      headers: this.getAuthHeaders(),
    });
  }

  async inviteMember(orgId, data) {
    return this.request(`/api/organizations/${orgId}/members`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async updateMemberRole(orgId, userId, role) {
    return this.request(`/api/organizations/${orgId}/members/${userId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(orgId, userId) {
    return this.request(`/api/organizations/${orgId}/members/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async getServices(orgId) {
    return this.request(`/api/organizations/${orgId}/services`, {
      headers: this.getAuthHeaders(),
    });
  }

  async createService(orgId, data) {
    return this.request(`/api/organizations/${orgId}/services`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async updateService(orgId, serviceId, data) {
    return this.request(`/api/organizations/${orgId}/services/${serviceId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deleteService(orgId, serviceId) {
    return this.request(`/api/organizations/${orgId}/services/${serviceId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async updateServiceStatus(orgId, serviceId, status, message) {
    return this.request(`/api/organizations/${orgId}/services/${serviceId}/status`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, message }),
    });
  }

  async getServiceHistory(orgId, serviceId) {
    return this.request(`/api/organizations/${orgId}/services/${serviceId}/history`, {
      headers: this.getAuthHeaders(),
    });
  }

  async getIncidents(orgId, status = null) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/organizations/${orgId}/incidents${query}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async createIncident(orgId, data) {
    return this.request(`/api/organizations/${orgId}/incidents`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async getIncident(orgId, incidentId) {
    return this.request(`/api/organizations/${orgId}/incidents/${incidentId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async updateIncident(orgId, incidentId, data) {
    return this.request(`/api/organizations/${orgId}/incidents/${incidentId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deleteIncident(orgId, incidentId) {
    return this.request(`/api/organizations/${orgId}/incidents/${incidentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async addIncidentUpdate(orgId, incidentId, data) {
    return this.request(`/api/organizations/${orgId}/incidents/${incidentId}/updates`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async resolveIncident(orgId, incidentId, message) {
    return this.request(`/api/organizations/${orgId}/incidents/${incidentId}/resolve`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
  }

  async getMaintenances(orgId, status = null) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/organizations/${orgId}/maintenances${query}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async createMaintenance(orgId, data) {
    return this.request(`/api/organizations/${orgId}/maintenances`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async getMaintenance(orgId, maintenanceId) {
    return this.request(`/api/organizations/${orgId}/maintenances/${maintenanceId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async updateMaintenance(orgId, maintenanceId, data) {
    return this.request(`/api/organizations/${orgId}/maintenances/${maintenanceId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deleteMaintenance(orgId, maintenanceId) {
    return this.request(`/api/organizations/${orgId}/maintenances/${maintenanceId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async startMaintenance(orgId, maintenanceId) {
    return this.request(`/api/organizations/${orgId}/maintenances/${maintenanceId}/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
  }

  async completeMaintenance(orgId, maintenanceId) {
    return this.request(`/api/organizations/${orgId}/maintenances/${maintenanceId}/complete`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
  }

  async getPublicStatus(orgSlug) {
    return this.request(`/api/public/status/${orgSlug}`);
  }

  async getPublicServiceDetails(orgSlug, serviceId, timeRange = '1h') {
    return this.request(`/api/public/status/${orgSlug}/${serviceId}?timeRange=${timeRange}`);
  }
}

export const api = new ApiService();

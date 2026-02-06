import { useState, useEffect } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const Services = () => {
  const { currentOrganization } = useOrganization();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', target_url: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      loadServices();
    }
  }, [currentOrganization]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { services: data } = await api.getServices(currentOrganization.id);
      setServices(data || []);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingService) {
        await api.updateService(currentOrganization.id, editingService.id, formData);
      } else {
        await api.createService(currentOrganization.id, formData);
      }
      setFormData({ name: '', description: '', target_url: '' });
      setShowForm(false);
      setEditingService(null);
      await loadServices();
    } catch (error) {
      console.error('Failed to save service:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({ name: service.name, description: service.description || '', target_url: service.target_url || '' });
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.deleteService(currentOrganization.id, serviceId);
      await loadServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const handleStatusChange = async (serviceId, newStatus) => {
    try {
      await api.updateServiceStatus(currentOrganization.id, serviceId, newStatus);
      await loadServices();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading services..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="mt-2 text-gray-600">Manage your monitored services</p>
          </div>
          <button
            onClick={() => {
              setEditingService(null);
              setFormData({ name: '', description: '', target_url: '' });
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            Add Service
          </button>
        </div>

        {showForm && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              {editingService ? 'Edit Service' : 'New Service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target URL
                </label>
                <input
                  type="url"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  className="input"
                  placeholder="https://api.example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: URL to monitor for this service
                </p>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingService(null);
                    setFormData({ name: '', description: '', target_url: '' });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {services.length === 0 ? (
          <EmptyState
            title="No services yet"
            description="Add your first service to start monitoring its status."
            action={
              <button onClick={() => { setShowForm(true); setFormData({ name: '', description: '', target_url: '' }); }} className="btn btn-primary">
                Add Service
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    {service.description && (
                      <p className="mt-1 text-sm text-gray-600">{service.description}</p>
                    )}
                    {service.target_url && (
                      <a 
                        href={service.target_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-1 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {service.target_url}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    <div className="mt-3">
                      <StatusBadge status={service.current_status} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['operational', 'degraded_performance', 'partial_outage', 'major_outage'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(service.id, status)}
                        className={`px-3 py-1 rounded text-sm ${
                          service.current_status === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

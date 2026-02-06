import { useState, useEffect } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const Incidents = () => {
  const { currentOrganization } = useOrganization();
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    impact: 'degraded_performance',
    service_ids: []
  });
  const [updateForm, setUpdateForm] = useState({ status: 'investigating', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      loadData();
    }
  }, [currentOrganization]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incidentsData, servicesData] = await Promise.all([
        api.getIncidents(currentOrganization.id),
        api.getServices(currentOrganization.id)
      ]);
      setIncidents(incidentsData.incidents || []);
      setServices(servicesData.services || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createIncident(currentOrganization.id, formData);
      setFormData({ title: '', description: '', impact: 'degraded_performance', service_ids: [] });
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Failed to create incident:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUpdate = async (incidentId) => {
    try {
      await api.addIncidentUpdate(currentOrganization.id, incidentId, updateForm);
      setUpdateForm({ status: 'investigating', message: '' });
      setSelectedIncident(null);
      await loadData();
    } catch (error) {
      console.error('Failed to add update:', error);
    }
  };

  const handleResolve = async (incidentId) => {
    try {
      await api.resolveIncident(currentOrganization.id, incidentId, 'This incident has been resolved.');
      await loadData();
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading incidents..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incidents</h1>
            <p className="mt-2 text-gray-600">Track and manage service incidents</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Create Incident
          </button>
        </div>

        {showForm && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">New Incident</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impact Level</label>
                <select
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                  className="input"
                >
                  <option value="degraded_performance">Degraded Performance</option>
                  <option value="partial_outage">Partial Outage</option>
                  <option value="major_outage">Major Outage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affected Services
                </label>
                <div className="space-y-2">
                  {services.map((service) => (
                    <label key={service.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.service_ids.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              service_ids: [...formData.service_ids, service.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              service_ids: formData.service_ids.filter(id => id !== service.id)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating...' : 'Create Incident'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ title: '', description: '', impact: 'degraded_performance', service_ids: [] });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {incidents.length === 0 ? (
          <EmptyState
            title="No incidents"
            description="Create an incident when a service issue occurs."
            action={
              <button onClick={() => setShowForm(true)} className="btn btn-primary">
                Create Incident
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{incident.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                    <div className="flex gap-2 mt-2">
                      <StatusBadge status={incident.status} />
                      <StatusBadge status={incident.impact} />
                    </div>
                  </div>
                  {incident.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(incident.id)}
                      className="btn btn-primary text-sm"
                    >
                      Resolve
                    </button>
                  )}
                </div>

                {incident.affected_services && incident.affected_services.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Affected Services:</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {incident.affected_services.map((service) => (
                        <span key={service.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Started: {new Date(incident.started_at).toLocaleString()}
                  {incident.resolved_at && (
                    <> • Resolved: {new Date(incident.resolved_at).toLocaleString()}</>
                  )}
                </div>

                {incident.status !== 'resolved' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {selectedIncident === incident.id ? (
                      <div className="space-y-3">
                        <select
                          value={updateForm.status}
                          onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                          className="input"
                        >
                          <option value="investigating">Investigating</option>
                          <option value="identified">Identified</option>
                          <option value="monitoring">Monitoring</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <textarea
                          value={updateForm.message}
                          onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })}
                          placeholder="Update message..."
                          className="input"
                          rows="2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddUpdate(incident.id)}
                            className="btn btn-primary text-sm"
                          >
                            Post Update
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIncident(null);
                              setUpdateForm({ status: 'investigating', message: '' });
                            }}
                            className="btn btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedIncident(incident.id)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Add Update
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

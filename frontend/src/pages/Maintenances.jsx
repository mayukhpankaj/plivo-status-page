import { useState, useEffect } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const Maintenances = () => {
  const { currentOrganization } = useOrganization();
  const [maintenances, setMaintenances] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_start: '',
    scheduled_end: '',
    service_ids: []
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      loadData();
    }
  }, [currentOrganization]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [maintenancesData, servicesData] = await Promise.all([
        api.getMaintenances(currentOrganization.id),
        api.getServices(currentOrganization.id)
      ]);
      setMaintenances(maintenancesData.maintenances || []);
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
      await api.createMaintenance(currentOrganization.id, formData);
      setFormData({
        title: '',
        description: '',
        scheduled_start: '',
        scheduled_end: '',
        service_ids: []
      });
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Failed to create maintenance:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async (maintenanceId) => {
    try {
      await api.startMaintenance(currentOrganization.id, maintenanceId);
      await loadData();
    } catch (error) {
      console.error('Failed to start maintenance:', error);
    }
  };

  const handleComplete = async (maintenanceId) => {
    try {
      await api.completeMaintenance(currentOrganization.id, maintenanceId);
      await loadData();
    } catch (error) {
      console.error('Failed to complete maintenance:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading maintenances..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenances</h1>
            <p className="mt-2 text-gray-600">Schedule and manage maintenance windows</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Schedule Maintenance
          </button>
        </div>

        {showForm && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Schedule Maintenance</h2>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Start
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_start}
                    onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled End
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_end}
                    onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                    className="input"
                    required
                  />
                </div>
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
                  {submitting ? 'Scheduling...' : 'Schedule Maintenance'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      title: '',
                      description: '',
                      scheduled_start: '',
                      scheduled_end: '',
                      service_ids: []
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {maintenances.length === 0 ? (
          <EmptyState
            title="No maintenances scheduled"
            description="Schedule maintenance windows to inform users about planned downtime."
            action={
              <button onClick={() => setShowForm(true)} className="btn btn-primary">
                Schedule Maintenance
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            {maintenances.map((maintenance) => (
              <div key={maintenance.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{maintenance.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{maintenance.description}</p>
                    <div className="mt-2">
                      <StatusBadge status={maintenance.status} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {maintenance.status === 'scheduled' && (
                      <button
                        onClick={() => handleStart(maintenance.id)}
                        className="btn btn-primary text-sm"
                      >
                        Start
                      </button>
                    )}
                    {maintenance.status === 'in_progress' && (
                      <button
                        onClick={() => handleComplete(maintenance.id)}
                        className="btn btn-primary text-sm"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {maintenance.affected_services && maintenance.affected_services.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Affected Services:</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {maintenance.affected_services.map((service) => (
                        <span key={service.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Scheduled: {new Date(maintenance.scheduled_start).toLocaleString()} -{' '}
                  {new Date(maintenance.scheduled_end).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrganization } from '../contexts/OrganizationContext';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const Dashboard = () => {
  const { currentOrganization, organizations, createOrganization } = useOrganization();
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [currentOrganization]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [servicesData, incidentsData, maintenancesData] = await Promise.all([
        api.getServices(currentOrganization.id),
        api.getIncidents(currentOrganization.id),
        api.getMaintenances(currentOrganization.id)
      ]);
      setServices(servicesData.services || []);
      setIncidents(incidentsData.incidents || []);
      setMaintenances(maintenancesData.maintenances || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await createOrganization({ name: orgName });
      setOrgName('');
      setShowCreateOrg(false);
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading dashboard..." />
      </Layout>
    );
  }

  if (!currentOrganization && organizations.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <EmptyState
            title="No organizations yet"
            description="Create your first organization to get started with your status page."
            action={
              showCreateOrg ? (
                <form onSubmit={handleCreateOrganization} className="mt-4 max-w-md mx-auto">
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Organization name"
                    className="input mb-2"
                    required
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={creating} className="btn btn-primary flex-1">
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateOrg(false)}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowCreateOrg(true)} className="btn btn-primary">
                  Create Organization
                </button>
              )
            }
          />
        </div>
      </Layout>
    );
  }

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const upcomingMaintenances = maintenances.filter(m => m.status !== 'completed');

  const operationalServices = services.filter(s => s.current_status === 'operational').length;
  const totalServices = services.length;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of {currentOrganization.name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Services</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{totalServices}</p>
            <p className="mt-1 text-sm text-gray-600">
              {operationalServices} operational
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Active Incidents</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{activeIncidents.length}</p>
            <p className="mt-1 text-sm text-gray-600">
              {incidents.length} total incidents
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Upcoming Maintenances</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{upcomingMaintenances.length}</p>
            <p className="mt-1 text-sm text-gray-600">
              {maintenances.length} total maintenances
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Services</h2>
              <Link to="/services" className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            {services.length === 0 ? (
              <p className="text-gray-500 text-sm">No services yet</p>
            ) : (
              <div className="space-y-3">
                {services.slice(0, 5).map(service => (
                  <div key={service.id} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{service.name}</span>
                    <StatusBadge status={service.current_status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Active Incidents</h2>
              <Link to="/incidents" className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            {activeIncidents.length === 0 ? (
              <p className="text-gray-500 text-sm">No active incidents</p>
            ) : (
              <div className="space-y-3">
                {activeIncidents.slice(0, 5).map(incident => (
                  <div key={incident.id} className="border-l-4 border-red-500 pl-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{incident.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(incident.started_at).toLocaleString()}
                        </p>
                      </div>
                      <StatusBadge status={incident.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/services" className="btn btn-secondary text-center">
              Manage Services
            </Link>
            <Link to="/incidents" className="btn btn-secondary text-center">
              View Incidents
            </Link>
            <Link to="/maintenances" className="btn btn-secondary text-center">
              Schedule Maintenance
            </Link>
            <Link to="/team" className="btn btn-secondary text-center">
              Manage Team
            </Link>
          </div>
        </div>

        {currentOrganization && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Public Status Page</h3>
            <p className="text-sm text-blue-700 mb-3">
              Your public status page is available at:
            </p>
            <a
              href={`${window.location.origin}/status/${currentOrganization.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white px-3 py-2 rounded border border-blue-200 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
            >
              {window.location.origin}/status/{currentOrganization.slug}
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
};

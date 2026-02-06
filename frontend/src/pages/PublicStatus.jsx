import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const PublicStatus = () => {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    loadStatusData();
    
    if (autoRefresh) {
      const interval = setInterval(loadStatusData, 60000);
      return () => clearInterval(interval);
    }
  }, [orgSlug, autoRefresh]);

  const loadStatusData = async () => {
    try {
      setLoading(true);
      setError(null);
      const statusData = await api.getPublicStatus(orgSlug);
      setData(statusData);
    } catch (err) {
      setError(err.message || 'Failed to load status page');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading status page..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Status Page Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const getOverallStatusMessage = () => {
    switch (data.overall_status) {
      case 'operational':
        return 'All Systems Operational';
      case 'degraded_performance':
        return 'Some Systems Experiencing Issues';
      case 'partial_outage':
        return 'Partial Service Outage';
      case 'major_outage':
        return 'Major Service Outage';
      default:
        return 'Status Unknown';
    }
  };

  const getOverallStatusColor = () => {
    switch (data.overall_status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded_performance':
        return 'bg-yellow-500';
      case 'partial_outage':
        return 'bg-orange-500';
      case 'major_outage':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const allIncidents = [...(data.active_incidents || []), ...(data.recent_incidents || [])];

  const renderIncidentCard = (incident, isActive = false) => (
    <div key={incident.id} className={`bg-white rounded-lg shadow-sm border ${isActive ? 'border-red-200' : 'border-gray-200'} p-6`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{incident.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
          {!isActive && incident.started_at && incident.resolved_at && (
            <p className="text-xs text-gray-500 mt-2">
              {new Date(incident.started_at).toLocaleString()} - {new Date(incident.resolved_at).toLocaleString()}
            </p>
          )}
        </div>
        <StatusBadge status={incident.status} />
      </div>

      {incident.affected_services && incident.affected_services.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">Affected Services:</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {incident.affected_services.map((service) => (
              <span key={service.id} className={`text-xs ${isActive ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'} px-2 py-1 rounded`}>
                {service.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {incident.updates && incident.updates.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Updates</h4>
          <div className="space-y-3">
            {incident.updates.map((update) => (
              <div key={update.id} className="border-l-2 border-blue-500 pl-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{update.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(update.created_at).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={update.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              {data.organization.logo_url && (
                <img
                  src={data.organization.logo_url}
                  alt={data.organization.name}
                  className="h-12 mb-4"
                />
              )}
              <h1 className="text-3xl font-bold text-gray-900">
                {data.organization.name} Status
              </h1>
              {data.organization.description && (
                <p className="mt-2 text-gray-600">{data.organization.description}</p>
              )}
            </div>
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
          </div>

          <div className={`${getOverallStatusColor()} text-white rounded-lg p-6 shadow-lg`}>
            <div className="flex items-center">
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{getOverallStatusMessage()}</h2>
                <p className="mt-1 text-sm opacity-90">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {data.services.filter(s => s.current_status === 'operational').length}/
                  {data.services.length}
                </div>
                <div className="text-sm opacity-90">Services Operational</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Services Status</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {data.services.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No services configured yet
              </div>
            ) : (
              data.services.map((service) => (
                <div 
                  key={service.id} 
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/status/${orgSlug}/${service.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      )}
                    </div>
                    <StatusBadge status={service.current_status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Active Incidents
                {data.active_incidents.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                    {data.active_incidents.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                All Incidents
                {allIncidents.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                    {allIncidents.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`${
                  activeTab === 'maintenance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Maintenance
                {data.upcoming_maintenances.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                    {data.upcoming_maintenances.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="space-y-4">
            {activeTab === 'active' && (
              <>
                {data.active_incidents.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-green-500 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No active incidents</p>
                    <p className="text-sm text-gray-500 mt-1">All systems are operational</p>
                  </div>
                ) : (
                  data.active_incidents.map((incident) => renderIncidentCard(incident, true))
                )}
              </>
            )}

            {activeTab === 'all' && (
              <>
                {allIncidents.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-600 font-medium">No incidents to display</p>
                    <p className="text-sm text-gray-500 mt-1">There are no recorded incidents</p>
                  </div>
                ) : (
                  allIncidents.map((incident) => renderIncidentCard(incident, incident.status !== 'resolved'))
                )}
              </>
            )}

            {activeTab === 'maintenance' && (
              <>
                {data.upcoming_maintenances.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-600 font-medium">No scheduled maintenance</p>
                    <p className="text-sm text-gray-500 mt-1">There are no upcoming maintenance windows</p>
                  </div>
                ) : (
                  data.upcoming_maintenances.map((maintenance) => (
                    <div key={maintenance.id} className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{maintenance.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{maintenance.description}</p>
                        </div>
                        <StatusBadge status={maintenance.status} />
                      </div>

                      {maintenance.affected_services && maintenance.affected_services.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">Affected Services:</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {maintenance.affected_services.map((service) => (
                              <span key={service.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                {service.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-gray-600">
                        <strong>Scheduled:</strong>{' '}
                        {new Date(maintenance.scheduled_start).toLocaleString()} - {new Date(maintenance.scheduled_end).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-8 pb-8">
          <p>
            Powered by StatusPage •{' '}
            {data.organization.website_url && (
              <a
                href={data.organization.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Visit Website
              </a>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

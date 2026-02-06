import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const PublicServiceDetail = () => {
  const { orgSlug, serviceId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadServiceData();
    
    if (autoRefresh) {
      const interval = setInterval(loadServiceData, 60000);
      return () => clearInterval(interval);
    }
  }, [orgSlug, serviceId, timeRange, autoRefresh]);

  const loadServiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const serviceData = await api.getPublicServiceDetails(orgSlug, serviceId, timeRange);
      setData(serviceData);
    } catch (err) {
      setError(err.message || 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading service details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/status/${orgSlug}`)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Status Page
          </button>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    if (timeRange === '1h' || timeRange === '6h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
    }
  };

  const calculateUptime = () => {
    if (!data.metrics?.uptime || data.metrics.uptime.length === 0) {
      return 'N/A';
    }
    const uptimeData = data.metrics.uptime;
    const totalPoints = uptimeData.length;
    const upPoints = uptimeData.filter(point => point.value === 1).length;
    return ((upPoints / totalPoints) * 100).toFixed(2);
  };

  const calculateAvgResponseTime = () => {
    if (!data.metrics?.responseTime || data.metrics.responseTime.length === 0) {
      return 'N/A';
    }
    const responseTimes = data.metrics.responseTime;
    const sum = responseTimes.reduce((acc, point) => acc + point.value, 0);
    const avg = sum / responseTimes.length;
    return (avg * 1000).toFixed(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
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

  const timeRangeOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/status/${orgSlug}`)}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Status Page
          </button>

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {data.organization.logo_url && (
                <img
                  src={data.organization.logo_url}
                  alt={data.organization.name}
                  className="h-10 mb-3"
                />
              )}
              <h1 className="text-3xl font-bold text-gray-900">{data.service.name}</h1>
              {data.service.description && (
                <p className="mt-2 text-gray-600">{data.service.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                Auto-refresh
              </label>
              <StatusBadge status={data.service.current_status} />
            </div>
          </div>

          <div className={`${getStatusColor(data.service.current_status)} text-white rounded-lg p-6 shadow-lg`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm opacity-90">Current Status</div>
                <div className="text-2xl font-bold mt-1">
                  {data.metrics?.current?.up ? 'Online' : 'Offline'}
                </div>
              </div>
              <div>
                <div className="text-sm opacity-90">Uptime ({timeRange})</div>
                <div className="text-2xl font-bold mt-1">{calculateUptime()}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90">Avg Response Time</div>
                <div className="text-2xl font-bold mt-1">
                  {calculateAvgResponseTime()} ms
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Performance Metrics</h2>
            <div className="flex gap-2">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    timeRange === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {data.metrics && !data.metrics.error ? (
            <div className="space-y-6">
              {data.metrics.uptime && data.metrics.uptime.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Uptime</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data.metrics.uptime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatTimestamp}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis domain={[0, 1]} ticks={[0, 1]} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={formatTimestamp}
                        formatter={(value) => [value === 1 ? 'Up' : 'Down', 'Status']}
                      />
                      <Line 
                        type="stepAfter" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data.metrics.responseTime && data.metrics.responseTime.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time (seconds)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data.metrics.responseTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatTimestamp}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={formatTimestamp}
                        formatter={(value) => [(value * 1000).toFixed(0) + ' ms', 'Response Time']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data.metrics.httpStatus && data.metrics.httpStatus.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">HTTP Status Code</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data.metrics.httpStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatTimestamp}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={formatTimestamp}
                        formatter={(value) => [value, 'Status Code']}
                      />
                      <Line 
                        type="stepAfter" 
                        dataKey="value" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">
                {data.metrics?.error || 'No metrics data available. Ensure Prometheus is configured and collecting data for this service.'}
              </p>
            </div>
          )}
        </div>

        {data.incidents && data.incidents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Incidents</h2>
            <div className="space-y-4">
              {data.incidents.map((incident) => (
                <div key={incident.id} className={`bg-white rounded-lg shadow-sm border ${incident.status !== 'resolved' ? 'border-red-200' : 'border-gray-200'} p-6`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{incident.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                      {incident.started_at && incident.resolved_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(incident.started_at).toLocaleString()} - {new Date(incident.resolved_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={incident.status} />
                  </div>

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
              ))}
            </div>
          </div>
        )}

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

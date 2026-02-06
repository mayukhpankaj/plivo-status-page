export const StatusBadge = ({ status }) => {
  const statusConfig = {
    operational: {
      label: 'Operational',
      className: 'bg-green-100 text-green-800',
      dot: 'bg-green-500'
    },
    degraded_performance: {
      label: 'Degraded Performance',
      className: 'bg-yellow-100 text-yellow-800',
      dot: 'bg-yellow-500'
    },
    partial_outage: {
      label: 'Partial Outage',
      className: 'bg-orange-100 text-orange-800',
      dot: 'bg-orange-500'
    },
    major_outage: {
      label: 'Major Outage',
      className: 'bg-red-100 text-red-800',
      dot: 'bg-red-500'
    },
    investigating: {
      label: 'Investigating',
      className: 'bg-blue-100 text-blue-800',
      dot: 'bg-blue-500'
    },
    identified: {
      label: 'Identified',
      className: 'bg-purple-100 text-purple-800',
      dot: 'bg-purple-500'
    },
    monitoring: {
      label: 'Monitoring',
      className: 'bg-indigo-100 text-indigo-800',
      dot: 'bg-indigo-500'
    },
    resolved: {
      label: 'Resolved',
      className: 'bg-green-100 text-green-800',
      dot: 'bg-green-500'
    },
    scheduled: {
      label: 'Scheduled',
      className: 'bg-gray-100 text-gray-800',
      dot: 'bg-gray-500'
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-blue-100 text-blue-800',
      dot: 'bg-blue-500'
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-800',
      dot: 'bg-green-500'
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-800',
      dot: 'bg-gray-500'
    }
  };

  const config = statusConfig[status] || statusConfig.operational;

  return (
    <span className={`status-badge ${config.className}`}>
      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${config.dot}`}></span>
      {config.label}
    </span>
  );
};

import { useState, useEffect } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const Team = () => {
  const { currentOrganization } = useOrganization();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'viewer' });
  const [submitting, setSubmitting] = useState(false);

  const adminCount = members.filter(m => m.role === 'admin').length;
  const isLastAdmin = (member) => member.role === 'admin' && adminCount === 1;

  useEffect(() => {
    if (currentOrganization) {
      loadMembers();
    }
  }, [currentOrganization]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const { members: data } = await api.getMembers(currentOrganization.id);
      setMembers(data || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.inviteMember(currentOrganization.id, inviteData);
      setInviteData({ email: '', role: 'viewer' });
      setShowInvite(false);
      await loadMembers();
    } catch (error) {
      console.error('Failed to invite member:', error);
      alert(error.message || 'Failed to invite member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.updateMemberRole(currentOrganization.id, userId, newRole);
      await loadMembers();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.removeMember(currentOrganization.id, userId);
      await loadMembers();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading team members..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team</h1>
            <p className="mt-2 text-gray-600">Manage team members and roles</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="btn btn-primary">
            Invite Member
          </button>
        </div>

        {showInvite && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Invite Team Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="input"
                  placeholder="user@example.com"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  User must already have an account
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="input"
                >
                  <option value="viewer">Viewer - Read-only access</option>
                  <option value="member">Member - Can manage incidents</option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Inviting...' : 'Send Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInvite(false);
                    setInviteData({ email: '', role: 'viewer' });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {members.length === 0 ? (
          <EmptyState
            title="No team members"
            description="Invite team members to collaborate on your status page."
            action={
              <button onClick={() => setShowInvite(true)} className="btn btn-primary">
                Invite Member
              </button>
            }
          />
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                          disabled={isLastAdmin(member)}
                          className={`text-sm border border-gray-300 rounded px-2 py-1 ${isLastAdmin(member) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          title={isLastAdmin(member) ? 'Cannot change role of the last admin' : ''}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString()
                          : 'Pending'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleRemove(member.user_id)}
                          disabled={isLastAdmin(member)}
                          className={`${isLastAdmin(member) ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                          title={isLastAdmin(member) ? 'Cannot remove the last admin' : ''}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Role Permissions</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div>
              <strong>Admin:</strong> Full access - manage services, incidents, team members, and organization settings
            </div>
            <div>
              <strong>Member:</strong> Can create and update incidents, manage maintenances, and update service status
            </div>
            <div>
              <strong>Viewer:</strong> Read-only access to all organization data
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

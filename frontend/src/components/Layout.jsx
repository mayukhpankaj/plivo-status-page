import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';

export const Layout = ({ children }) => {
  const { user, signOut } = useAuth();
  const { currentOrganization, organizations, switchOrganization } = useOrganization();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                StatusPage
              </Link>
              
              {currentOrganization && (
                <div className="flex items-center space-x-4">
                  <select
                    value={currentOrganization.id}
                    onChange={(e) => {
                      const org = organizations.find(o => o.id === e.target.value);
                      if (org) switchOrganization(org);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  
                  <div className="hidden md:flex space-x-4">
                    <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                      Dashboard
                    </Link>
                    <Link to="/services" className="text-gray-700 hover:text-blue-600">
                      Services
                    </Link>
                    <Link to="/incidents" className="text-gray-700 hover:text-blue-600">
                      Incidents
                    </Link>
                    <Link to="/maintenances" className="text-gray-700 hover:text-blue-600">
                      Maintenances
                    </Link>
                    <Link to="/team" className="text-gray-700 hover:text-blue-600">
                      Team
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="btn btn-secondary text-sm"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

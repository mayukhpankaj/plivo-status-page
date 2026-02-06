import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const OrganizationContext = createContext({});

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const { organizations: orgs } = await api.getOrganizations();
      setOrganizations(orgs);
      
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      const savedOrg = orgs.find(o => o.id === savedOrgId);
      
      if (savedOrg) {
        setCurrentOrganization(savedOrg);
      } else if (orgs.length > 0) {
        setCurrentOrganization(orgs[0]);
        localStorage.setItem('currentOrganizationId', orgs[0].id);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = (org) => {
    setCurrentOrganization(org);
    localStorage.setItem('currentOrganizationId', org.id);
  };

  const createOrganization = async (data) => {
    const { organization } = await api.createOrganization(data);
    await loadOrganizations();
    switchOrganization(organization);
    return organization;
  };

  const value = {
    organizations,
    currentOrganization,
    loading,
    switchOrganization,
    createOrganization,
    refreshOrganizations: loadOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

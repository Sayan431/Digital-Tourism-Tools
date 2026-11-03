import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(() => {
    const saved = localStorage.getItem('activeOrgId');
    return saved ? parseInt(saved, 10) : null;
  });
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Fetch current user and orgs on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));

          // Set default activeOrgId
          if (res.data.role === 'admin') {
            setActiveOrgId(res.data.organization_id);
            localStorage.setItem('activeOrgId', res.data.organization_id);
          }

          // Fetch orgs list
          const orgsRes = await api.get('/organizations');
          setOrganizations(orgsRes.data);

          // If super admin and no activeOrgId selected yet, default to first org or null (platform-wide)
          if (res.data.role === 'super_admin' && !activeOrgId && orgsRes.data.length > 0) {
            // Keep null or first org
          }

          // Fetch notifications count
          fetchUnreadCount(res.data.organization_id);
        } catch (err) {
          console.error('Failed to verify token', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const fetchUnreadCount = useCallback(async (orgId) => {
    try {
      const params = orgId ? { org_id: orgId, unread_only: true } : { unread_only: true };
      const res = await api.get('/notifications', { params });
      setUnreadNotifCount(res.data.length);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: loggedUser } = res.data;
    
    setToken(access_token);
    setUser(loggedUser);
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(loggedUser));

    if (loggedUser.role === 'admin') {
      setActiveOrgId(loggedUser.organization_id);
      localStorage.setItem('activeOrgId', loggedUser.organization_id);
    } else {
      setActiveOrgId(null); // Platform-wide by default for Super Admin
      localStorage.removeItem('activeOrgId');
    }

    // Refresh orgs
    const orgsRes = await api.get('/organizations');
    setOrganizations(orgsRes.data);
    fetchUnreadCount(loggedUser.organization_id);

    return loggedUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setActiveOrgId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeOrgId');
  };

  const switchActiveOrg = (orgId) => {
    if (user?.role === 'super_admin') {
      const parsed = orgId ? parseInt(orgId, 10) : null;
      setActiveOrgId(parsed);
      if (parsed) {
        localStorage.setItem('activeOrgId', parsed);
      } else {
        localStorage.removeItem('activeOrgId');
      }
      fetchUnreadCount(parsed);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        organizations,
        activeOrgId,
        unreadNotifCount,
        setUnreadNotifCount,
        fetchUnreadCount,
        login,
        logout,
        switchActiveOrg,
        isAuthenticated: !!token && !!user,
        isSuperAdmin: user?.role === 'super_admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


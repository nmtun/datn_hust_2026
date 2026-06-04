import api from './axios';

const resolveTenantSubdomain = () => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase();

  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    return null;
  }

  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.');
    return parts.length > 1 ? parts[0] : null;
  }

  const segments = hostname.split('.');
  if (segments.length < 3) return null;

  return segments[0] || null;
};

const buildTenantParams = () => {
  const subdomain = resolveTenantSubdomain();
  if (!subdomain) {
    return { ok: false, subdomain: null };
  }
  return { ok: true, subdomain };
};

export const JobDescriptionApi = {
  getAll: async () => {
    try {
      const tenant = buildTenantParams();
      if (!tenant.ok) {
        return { error: true, message: 'Không xác định tenant từ subdomain.' };
      }

      const response = await api.get('api/job-description/get-all', {
        params: { subdomain: tenant.subdomain }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
      throw error;
    }
  },

  getById: async (id: number) => {
    try {
      const tenant = buildTenantParams();
      if (!tenant.ok) {
        return { error: true, message: 'Không xác định tenant từ subdomain.' };
      }

      const response = await api.get(`api/job-description/get/${id}`, {
        params: { subdomain: tenant.subdomain }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching job description with id ${id}:`, error);
      throw error;
    }
  }
};
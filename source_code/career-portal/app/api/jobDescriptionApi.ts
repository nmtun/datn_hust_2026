import api from './axios';

const resolveTenantSubdomain = () => {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname.toLowerCase();

  // localhost
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  ) {
    return null;
  }

  // tenant.localhost
  if (hostname.endsWith('.localhost')) {
    return hostname.split('.')[0];
  }

  // production
  const baseDomain = 'tenanthub.io.vn';

  if (!hostname.endsWith(baseDomain)) {
    return null;
  }

  const subdomain = hostname.replace(`.${baseDomain}`, '');

  return subdomain || null;
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
import * as tenantService from '../services/TenantServices.js';

export const createTenant = async (req, res) => {
    try {
        const result = await tenantService.createTenantService(req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error creating tenant:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const getAllTenants = async (req, res) => {
    try {
        const result = await tenantService.getAllTenantsService(req.query);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error getting tenants:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const getTenantById = async (req, res) => {
    try {
        const result = await tenantService.getTenantByIdService(req.params.id, req.query.include_deleted);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error getting tenant:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const updateTenant = async (req, res) => {
    try {
        const result = await tenantService.updateTenantService(req.params.id, req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error updating tenant:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const deleteTenant = async (req, res) => {
    try {
        const result = await tenantService.deleteTenantService(req.params.id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error deleting tenant:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

export const restoreTenant = async (req, res) => {
    try {
        const result = await tenantService.restoreTenantService(req.params.id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error restoring tenant:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
};

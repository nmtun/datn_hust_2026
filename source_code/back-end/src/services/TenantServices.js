import { Op } from "sequelize";
import Tenant from "../models/Tenant.js";

const STATUS_VALUES = ['active', 'inactive', 'suspended'];
const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const isTruthyFlag = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
    }
    return false;
};

const buildSearchWhere = (searchTerm) => {
    if (!searchTerm) return null;
    return {
        [Op.or]: [
            { tenant_name: { [Op.like]: `%${searchTerm}%` } },
            { tenant_code: { [Op.like]: `%${searchTerm}%` } },
            { subdomain: { [Op.like]: `%${searchTerm}%` } },
            { company_email: { [Op.like]: `%${searchTerm}%` } },
            { phone_number: { [Op.like]: `%${searchTerm}%` } }
        ]
    };
};

const normalizeSubdomain = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
};

const isValidSubdomain = (value) => SUBDOMAIN_REGEX.test(value);

export const createTenantService = async (tenantData = {}) => {
    try {
        const {
            tenant_name,
            tenant_code,
            subdomain,
            company_email,
            phone_number,
            address,
            status = 'active'
        } = tenantData;

        if (!tenant_name) {
            return { status: 400, data: { error: true, message: "Tenant name is required" } };
        }
        if (!tenant_code) {
            return { status: 400, data: { error: true, message: "Tenant code is required" } };
        }
        const normalizedSubdomain = normalizeSubdomain(subdomain);
        if (!normalizedSubdomain) {
            return { status: 400, data: { error: true, message: "Subdomain is required" } };
        }
        if (!isValidSubdomain(normalizedSubdomain)) {
            return { status: 400, data: { error: true, message: "Invalid subdomain format" } };
        }
        if (!company_email) {
            return { status: 400, data: { error: true, message: "Company email is required" } };
        }
        if (!STATUS_VALUES.includes(status)) {
            return { status: 400, data: { error: true, message: "Invalid status" } };
        }

        const existing = await Tenant.findOne({
            where: {
                is_deleted: false,
                [Op.or]: [
                    { tenant_name },
                    { tenant_code },
                    { subdomain: normalizedSubdomain },
                    { company_email }
                ]
            }
        });
        if (existing) {
            return { status: 409, data: { error: true, message: "Tenant already exists" } };
        }

        const tenant = await Tenant.create({
            tenant_name,
            tenant_code,
            subdomain: normalizedSubdomain,
            company_email,
            phone_number: phone_number || null,
            address: address || null,
            status,
            created_at: new Date(),
            updated_at: new Date(),
            is_deleted: false
        });

        return {
            status: 201,
            data: { error: false, message: "Tenant created successfully", tenant }
        };
    } catch (error) {
        console.error('Error in createTenantService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllTenantsService = async (query = {}) => {
    try {
        const { status, include_deleted, search } = query;
        const where = {};

        if (!isTruthyFlag(include_deleted)) {
            where.is_deleted = false;
        }

        if (status) {
            if (!STATUS_VALUES.includes(status)) {
                return { status: 400, data: { error: true, message: "Invalid status" } };
            }
            where.status = status;
        }

        const searchWhere = buildSearchWhere(search);
        if (searchWhere) {
            Object.assign(where, searchWhere);
        }

        const tenants = await Tenant.findAll({
            where,
            order: [['created_at', 'DESC']]
        });

        return {
            status: 200,
            data: { error: false, message: "Tenants retrieved successfully", tenants }
        };
    } catch (error) {
        console.error('Error in getAllTenantsService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getTenantByIdService = async (tenantId, includeDeleted = false) => {
    try {
        const where = { tenant_id: tenantId };
        if (!isTruthyFlag(includeDeleted)) {
            where.is_deleted = false;
        }

        const tenant = await Tenant.findOne({ where });
        if (!tenant) {
            return { status: 404, data: { error: true, message: "Tenant not found" } };
        }

        return {
            status: 200,
            data: { error: false, message: "Tenant retrieved successfully", tenant }
        };
    } catch (error) {
        console.error('Error in getTenantByIdService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updateTenantService = async (tenantId, updateData = {}) => {
    try {
        const tenant = await Tenant.findOne({ where: { tenant_id: tenantId, is_deleted: false } });
        if (!tenant) {
            return { status: 404, data: { error: true, message: "Tenant not found" } };
        }

        const allowedFields = ['tenant_name', 'tenant_code', 'subdomain', 'company_email', 'phone_number', 'address', 'status'];
        const payload = {};

        allowedFields.forEach((field) => {
            if (updateData[field] !== undefined) {
                payload[field] = updateData[field];
            }
        });

        if (payload.status && !STATUS_VALUES.includes(payload.status)) {
            return { status: 400, data: { error: true, message: "Invalid status" } };
        }

        if (payload.subdomain !== undefined) {
            const normalizedSubdomain = normalizeSubdomain(payload.subdomain);
            if (!normalizedSubdomain) {
                return { status: 400, data: { error: true, message: "Subdomain is required" } };
            }
            if (!isValidSubdomain(normalizedSubdomain)) {
                return { status: 400, data: { error: true, message: "Invalid subdomain format" } };
            }

            const existingSubdomain = await Tenant.findOne({
                where: {
                    tenant_id: { [Op.ne]: tenant.tenant_id },
                    subdomain: normalizedSubdomain,
                    is_deleted: false
                }
            });

            if (existingSubdomain) {
                return { status: 409, data: { error: true, message: "Subdomain already exists" } };
            }

            payload.subdomain = normalizedSubdomain;
        }

        if (Object.keys(payload).length === 0) {
            return { status: 400, data: { error: true, message: "No valid fields to update" } };
        }

        payload.updated_at = new Date();

        await tenant.update(payload);

        return {
            status: 200,
            data: { error: false, message: "Tenant updated successfully", tenant }
        };
    } catch (error) {
        console.error('Error in updateTenantService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const deleteTenantService = async (tenantId) => {
    try {
        const tenant = await Tenant.findOne({ where: { tenant_id: tenantId, is_deleted: false } });
        if (!tenant) {
            return { status: 404, data: { error: true, message: "Tenant not found" } };
        }

        await tenant.update({ is_deleted: true, status: 'inactive', updated_at: new Date() });

        return {
            status: 200,
            data: { error: false, message: "Tenant deleted successfully" }
        };
    } catch (error) {
        console.error('Error in deleteTenantService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const restoreTenantService = async (tenantId) => {
    try {
        const tenant = await Tenant.findOne({ where: { tenant_id: tenantId } });
        if (!tenant) {
            return { status: 404, data: { error: true, message: "Tenant not found" } };
        }

        if (!tenant.is_deleted) {
            return { status: 400, data: { error: true, message: "Tenant is not deleted" } };
        }

        await tenant.update({ is_deleted: false, status: 'active', updated_at: new Date() });

        return {
            status: 200,
            data: { error: false, message: "Tenant restored successfully" }
        };
    } catch (error) {
        console.error('Error in restoreTenantService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

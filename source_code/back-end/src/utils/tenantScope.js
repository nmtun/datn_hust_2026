import { getRequestContext } from './requestContext.js';

const resolveRawTenantId = (value) => {
    if (value === undefined) return null;
    if (value === null) return null;
    return value;
};

export const resolveTenantId = (requestingUser = null) => {
    if (requestingUser?.tenant_id !== undefined) {
        return resolveRawTenantId(requestingUser.tenant_id);
    }

    if (requestingUser?.tenantId !== undefined) {
        return resolveRawTenantId(requestingUser.tenantId);
    }

    const context = getRequestContext();
    if (context && Object.prototype.hasOwnProperty.call(context, 'tenantId')) {
        return resolveRawTenantId(context.tenantId);
    }

    return null;
};

export const withTenantWhere = (where = {}, requestingUser = null) => {
    if (where && Object.prototype.hasOwnProperty.call(where, 'tenant_id')) {
        return where;
    }

    const tenantId = resolveTenantId(requestingUser);
    if (tenantId === null) {
        return where;
    }

    return {
        ...where,
        tenant_id: tenantId
    };
};

export const requireTenantId = (requestingUser = null) => {
    const tenantId = resolveTenantId(requestingUser);
    if (tenantId === null) {
        return { ok: false, tenantId: null };
    }
    return { ok: true, tenantId };
};

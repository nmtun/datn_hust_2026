import { Sequelize, Op } from "sequelize";
import dotenv from "dotenv";
import { getRequestContext } from "../utils/requestContext.js";

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "mysql",
        logging: false
    }
);

const TENANT_FIELD = "tenant_id";
const TENANT_MODEL_NAME = "Tenants";

const isTenantScopedModel = (model) => {
    if (!model?.rawAttributes?.[TENANT_FIELD]) return false;
    if (model?.name === TENANT_MODEL_NAME) return false;
    return true;
};

const mergeTenantWhere = (where, tenantId) => {
    if (!where) return { [TENANT_FIELD]: tenantId };
    return { [Op.and]: [where, { [TENANT_FIELD]: tenantId }] };
};

const hasTenantWhere = (where) => {
    if (!where) return false;
    if (Array.isArray(where)) return where.some(hasTenantWhere);
    if (typeof where !== 'object') return false;

    if (Object.prototype.hasOwnProperty.call(where, TENANT_FIELD)) {
        return true;
    }

    return Object.values(where).some(hasTenantWhere);
};

const assertTenantScope = (options) => {
    const context = getRequestContext();
    if (!context || !Object.prototype.hasOwnProperty.call(context, 'tenantId')) return;
    if (context?.role === 'super_admin') return;
    if (!isTenantScopedModel(options.model)) return;
    if (context.tenantId === null || context.tenantId === undefined) {
        if (!hasTenantWhere(options.where)) {
            throw new Error('Tenant scope missing for tenant-scoped query');
        }
    }
};

const applyTenantScopeToInclude = (include, tenantId) => {
    if (!include || !include.model) return;
    if (isTenantScopedModel(include.model)) {
        include.where = mergeTenantWhere(include.where, tenantId);
        if (include.required === undefined) {
            include.required = false;
        }
    }
    if (Array.isArray(include.include)) {
        include.include.forEach((child) => applyTenantScopeToInclude(child, tenantId));
    }
};

const getTenantIdFromContext = () => {
    const context = getRequestContext();
    if (!context || !Object.prototype.hasOwnProperty.call(context, "tenantId")) {
        return undefined;
    }
    return context.tenantId;
};

sequelize.addHook("beforeFind", (options) => {
    assertTenantScope(options);
    const tenantId = getTenantIdFromContext();
    if (tenantId === undefined || tenantId === null) return;
    if (!isTenantScopedModel(options.model)) return;

    options.where = mergeTenantWhere(options.where, tenantId);

    if (Array.isArray(options.include)) {
        options.include.forEach((include) => applyTenantScopeToInclude(include, tenantId));
    } else if (options.include) {
        applyTenantScopeToInclude(options.include, tenantId);
    }
});

sequelize.addHook("beforeCount", (options) => {
    assertTenantScope(options);
    const tenantId = getTenantIdFromContext();
    if (tenantId === undefined || tenantId === null) return;
    if (!isTenantScopedModel(options.model)) return;
    options.where = mergeTenantWhere(options.where, tenantId);
});

sequelize.addHook("beforeBulkUpdate", (options) => {
    assertTenantScope(options);
    const tenantId = getTenantIdFromContext();
    if (tenantId === undefined || tenantId === null) return;
    if (!isTenantScopedModel(options.model)) return;
    options.where = mergeTenantWhere(options.where, tenantId);
});

sequelize.addHook("beforeBulkDestroy", (options) => {
    assertTenantScope(options);
    const tenantId = getTenantIdFromContext();
    if (tenantId === undefined || tenantId === null) return;
    if (!isTenantScopedModel(options.model)) return;
    options.where = mergeTenantWhere(options.where, tenantId);
});

sequelize.addHook("beforeUpdate", (instance) => {
    const tenantId = getTenantIdFromContext();
    if (tenantId === undefined || tenantId === null) return;
    const model = instance?.constructor;
    if (!isTenantScopedModel(model)) return;
    instance.setDataValue(TENANT_FIELD, tenantId);
});

sequelize.addHook("beforeCreate", (instance) => {
    const tenantId = getTenantIdFromContext();
    if (tenantId === undefined || tenantId === null) return;
    const model = instance?.constructor;
    if (!isTenantScopedModel(model)) return;
    instance.setDataValue(TENANT_FIELD, tenantId);
});

sequelize.addHook("beforeBulkCreate", (instances) => {
    const tenantId = getTenantIdFromContext();
    if (tenantId === undefined || tenantId === null) return;
    instances.forEach((instance) => {
        const model = instance?.constructor;
        if (!isTenantScopedModel(model)) return;
        instance.setDataValue(TENANT_FIELD, tenantId);
    });
});

try {
    await sequelize.authenticate();
    console.log("Kết nối thành công đến cơ sở dữ liệu");
} catch (error) {
    console.error("Không thể két nối đến cơ sở dữ liệu", error);
};

export default sequelize;
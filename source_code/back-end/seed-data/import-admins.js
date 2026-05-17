import bcrypt from "bcrypt";
import { Op } from "sequelize";
import sequelize from "../src/config/dbsetup.js";
import "../src/models/associations.js";
import Tenant from "../src/models/Tenant.js";
import User from "../src/models/User.js";
import admins from "./admins.js";
import { DEFAULT_TENANT_CODE } from "./tenants.js";

const SALT_ROUNDS = 10;

const buildEmailWhere = (seed) => {
    const or = [];
    if (seed.personal_email) {
        or.push({ personal_email: seed.personal_email });
    }
    if (seed.company_email) {
        or.push({ company_email: seed.company_email });
    }
    if (or.length === 0) {
        return null;
    }
    return { [Op.or]: or };
};

const resolveTenantId = async (seed, transaction) => {
    if (seed.role !== "tenant_admin") {
        return null;
    }

    const tenantCode = seed.tenant_code ?? DEFAULT_TENANT_CODE;
    const tenant = await Tenant.findOne({
        where: { tenant_code: tenantCode },
        transaction
    });

    if (!tenant) {
        throw new Error(`Tenant not found: ${tenantCode}. Run seed:tenants first.`);
    }

    return tenant.tenant_id;
};

const buildUserPayload = (seed, password, tenantId) => ({
    tenant_id: tenantId,
    personal_email: seed.personal_email,
    company_email: seed.company_email ?? null,
    password,
    full_name: seed.full_name,
    phone_number: seed.phone_number ?? null,
    address: seed.address ?? null,
    role: seed.role,
    status: seed.status ?? "active",
    is_deleted: false
});

const importAdmins = async () => {
    const summary = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0
    };

    for (const seed of admins) {
        const transaction = await sequelize.transaction();

        try {
            if (!seed.personal_email || !seed.password || !seed.full_name || !seed.role) {
                summary.skipped += 1;
                console.warn("Skipped admin seed with missing required fields.");
                await transaction.rollback();
                continue;
            }

            const where = buildEmailWhere(seed);
            if (!where) {
                summary.skipped += 1;
                console.warn("Skipped admin seed without email.");
                await transaction.rollback();
                continue;
            }

            const existingUser = await User.findOne({ where, transaction });
            const tenantId = await resolveTenantId(seed, transaction);
            let user;

            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(seed.password, SALT_ROUNDS);
                const payload = buildUserPayload(seed, hashedPassword, tenantId);
                user = await User.create(payload, { transaction });
                summary.created += 1;
            } else {
                const payload = buildUserPayload(seed, existingUser.password, tenantId);
                await existingUser.update(payload, { transaction });
                user = existingUser;
                summary.updated += 1;
            }

            await transaction.commit();
            console.log(`Imported admin: ${user.personal_email}`);
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Failed admin seed: ${seed.personal_email ?? "unknown"} -> ${error.message}`);
        }
    }

    return summary;
};

try {
    const summary = await importAdmins();

    console.log("\n=== Admin import summary ===");
    console.log(`Created: ${summary.created}`);
    console.log(`Updated: ${summary.updated}`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Failed: ${summary.failed}`);
} catch (error) {
    console.error("Admin import failed:", error);
    process.exitCode = 1;
} finally {
    await sequelize.close();
}

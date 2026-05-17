import sequelize from "../src/config/dbsetup.js";
import "../src/models/associations.js";
import Tenant from "../src/models/Tenant.js";
import tenants, { DEFAULT_TENANT_CODE } from "./tenants.js";

const upsertTenants = async () => {
    const summary = {
        created: 0,
        updated: 0,
        failed: 0
    };

    for (const seed of tenants) {
        const transaction = await sequelize.transaction();

        try {
            const existing = await Tenant.findOne({
                where: { tenant_code: seed.tenant_code },
                transaction
            });

            const payload = {
                tenant_name: seed.tenant_name,
                tenant_code: seed.tenant_code,
                company_email: seed.company_email,
                phone_number: seed.phone_number ?? null,
                address: seed.address ?? null,
                status: seed.status ?? "active",
                updated_at: new Date()
            };

            if (!existing) {
                await Tenant.create(
                    {
                        ...payload,
                        created_at: new Date(),
                        is_deleted: false
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                summary.updated += 1;
            }

            await transaction.commit();
            console.log(`Imported tenant: ${seed.tenant_code}`);
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Failed tenant seed ${seed.tenant_code}: ${error.message}`);
        }
    }

    return summary;
};

try {
    const summary = await upsertTenants();

    console.log("\n=== Tenant import summary ===");
    console.log(`Default tenant code: ${DEFAULT_TENANT_CODE}`);
    console.log(`Created: ${summary.created}`);
    console.log(`Updated: ${summary.updated}`);
    console.log(`Failed: ${summary.failed}`);
} catch (error) {
    console.error("Tenant import failed:", error);
    process.exitCode = 1;
} finally {
    await sequelize.close();
}
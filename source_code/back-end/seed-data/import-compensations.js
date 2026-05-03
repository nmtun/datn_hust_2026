import { Op } from "sequelize";
import sequelize from "../src/config/dbsetup.js";
import "../src/models/associations.js";
import User from "../src/models/User.js";
import Compensation from "../src/models/Compensation.js";
import compensationSeeds from "./compensations.js";

const APPROVER_EMAIL = "mng1@company.com";

const buildApprovedAt = (effectiveDate) => new Date(`${effectiveDate}T09:00:00.000Z`);

const importCompensations = async () => {
    const summary = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0
    };

    const approver = await User.findOne({ where: { company_email: APPROVER_EMAIL } });
    if (!approver) {
        throw new Error(`Approver not found: ${APPROVER_EMAIL}`);
    }

    const emailList = [...new Set(compensationSeeds.map((seed) => seed.company_email))];
    const users = await User.findAll({
        where: { company_email: { [Op.in]: emailList } },
        attributes: ["user_id", "company_email"]
    });
    const usersByEmail = new Map(users.map((user) => [user.company_email, user]));

    for (const seed of compensationSeeds) {
        const user = usersByEmail.get(seed.company_email);
        if (!user) {
            summary.skipped += 1;
            console.warn(`Skipped: ${seed.company_email} (user not found)`);
            continue;
        }

        const transaction = await sequelize.transaction();

        try {
            const approvedAt = seed.approved_at ? new Date(seed.approved_at) : buildApprovedAt(seed.effective_date);

            const existing = await Compensation.findOne({
                where: {
                    user_id: user.user_id,
                    effective_date: seed.effective_date
                },
                transaction
            });

            if (!existing) {
                await Compensation.create({
                    user_id: user.user_id,
                    salary: seed.salary,
                    bonus: seed.bonus,
                    effective_date: seed.effective_date,
                    reason: seed.reason ?? null,
                    approved_by: approver.user_id,
                    approved_at: approvedAt,
                    created_at: approvedAt,
                    updated_at: null
                }, { transaction });
                summary.created += 1;
            } else {
                await existing.update({
                    salary: seed.salary,
                    bonus: seed.bonus,
                    reason: seed.reason ?? existing.reason,
                    approved_by: approver.user_id,
                    approved_at: approvedAt,
                    updated_at: new Date()
                }, { transaction });
                summary.updated += 1;
            }

            await transaction.commit();
            console.log(`Imported compensation: ${seed.company_email} (${seed.effective_date})`);
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Failed: ${seed.company_email} -> ${error.message}`);
        }
    }

    return summary;
};

try {
    const summary = await importCompensations();

    console.log("\n=== Compensation import summary ===");
    console.log(`Created: ${summary.created}`);
    console.log(`Updated: ${summary.updated}`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Failed: ${summary.failed}`);
} catch (error) {
    console.error("Compensation import failed:", error);
    process.exitCode = 1;
} finally {
    await sequelize.close();
}

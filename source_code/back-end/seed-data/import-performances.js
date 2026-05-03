import { Op } from "sequelize";
import sequelize from "../src/config/dbsetup.js";
import "../src/models/associations.js";
import User from "../src/models/User.js";
import PerformancePeriod from "../src/models/PerformancePeriod.js";
import Performance from "../src/models/Performance.js";
import performancePeriods from "./performance-periods.js";
import performanceSeeds from "./performances.js";

const buildReviewTimestamp = (reviewDate) => {
    if (!reviewDate) return new Date();
    const parsed = new Date(`${reviewDate}T09:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const upsertPerformancePeriods = async () => {
    const summary = {
        created: 0,
        updated: 0,
        skipped: 0
    };

    const periodsByKey = new Map();
    const transaction = await sequelize.transaction();

    try {
        for (const seed of performancePeriods) {
            if (!seed?.key) {
                summary.skipped += 1;
                console.warn("Skipped period seed without key.");
                continue;
            }

            const existing = await PerformancePeriod.findOne({
                where: {
                    period_name: seed.period_name,
                    start_date: seed.start_date
                },
                transaction
            });

            if (!existing) {
                const period = await PerformancePeriod.create({
                    period_name: seed.period_name,
                    start_date: seed.start_date,
                    end_date: seed.end_date,
                    status: seed.status,
                    description: seed.description ?? null
                }, { transaction });

                periodsByKey.set(seed.key, period);
                summary.created += 1;
                continue;
            }

            await existing.update({
                end_date: seed.end_date,
                status: seed.status,
                description: seed.description ?? existing.description
            }, { transaction });

            periodsByKey.set(seed.key, existing);
            summary.updated += 1;
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    return { summary, periodsByKey };
};

const getUsersByEmailMap = async (emails) => {
    if (emails.length === 0) return new Map();

    const users = await User.findAll({
        where: { company_email: { [Op.in]: emails } },
        attributes: ["user_id", "company_email"]
    });

    return new Map(users.map((user) => [user.company_email, user]));
};

const importPerformances = async (periodsByKey) => {
    const summary = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0
    };

    const emailList = [
        ...new Set(
            performanceSeeds.flatMap((seed) => [seed.employee_email, seed.reviewer_email]).filter(Boolean)
        )
    ];

    const usersByEmail = await getUsersByEmailMap(emailList);

    for (const seed of performanceSeeds) {
        const employee = usersByEmail.get(seed.employee_email);
        const reviewer = usersByEmail.get(seed.reviewer_email);
        const period = periodsByKey.get(seed.period_key);

        if (!employee || !reviewer || !period) {
            summary.skipped += 1;
            console.warn(
                `Skipped performance seed: employee=${seed.employee_email} reviewer=${seed.reviewer_email} period=${seed.period_key}`
            );
            continue;
        }

        if (employee.user_id === reviewer.user_id) {
            summary.skipped += 1;
            console.warn(`Skipped performance seed with same reviewer: ${seed.employee_email}`);
            continue;
        }

        if (!seed.review_date) {
            summary.skipped += 1;
            console.warn(`Skipped performance seed without review_date: ${seed.employee_email}`);
            continue;
        }

        const transaction = await sequelize.transaction();

        try {
            const existing = await Performance.findOne({
                where: {
                    user_id: employee.user_id,
                    reviewer_id: reviewer.user_id,
                    period_id: period.period_id
                },
                transaction
            });

            const payload = {
                user_id: employee.user_id,
                reviewer_id: reviewer.user_id,
                period_id: period.period_id,
                kpi_goals: seed.kpi_goals ?? null,
                achievement: seed.achievement ?? null,
                rating: seed.rating ?? 0,
                feedback: seed.feedback ?? null,
                visibility: seed.visibility ?? "shared_with_employee",
                review_date: seed.review_date
            };

            if (!existing) {
                await Performance.create({
                    ...payload,
                    created_at: buildReviewTimestamp(seed.review_date),
                    updated_at: null
                }, { transaction });
                summary.created += 1;
            } else {
                await existing.update({
                    ...payload,
                    updated_at: new Date()
                }, { transaction });
                summary.updated += 1;
            }

            await transaction.commit();
            console.log(`Imported performance: ${seed.employee_email} (${seed.period_key})`);
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Failed performance: ${seed.employee_email} -> ${error.message}`);
        }
    }

    return summary;
};

try {
    const { summary: periodSummary, periodsByKey } = await upsertPerformancePeriods();
    const perfSummary = await importPerformances(periodsByKey);

    console.log("\n=== Performance period import summary ===");
    console.log(`Created: ${periodSummary.created}`);
    console.log(`Updated: ${periodSummary.updated}`);
    console.log(`Skipped: ${periodSummary.skipped}`);

    console.log("\n=== Performance review import summary ===");
    console.log(`Created: ${perfSummary.created}`);
    console.log(`Updated: ${perfSummary.updated}`);
    console.log(`Skipped: ${perfSummary.skipped}`);
    console.log(`Failed: ${perfSummary.failed}`);
} catch (error) {
    console.error("Performance import failed:", error);
    process.exitCode = 1;
} finally {
    await sequelize.close();
}

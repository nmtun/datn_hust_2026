import bcrypt from "bcrypt";
import { Op } from "sequelize";
import sequelize from "../src/config/dbsetup.js";
import "../src/models/associations.js";
import Tenant from "../src/models/Tenant.js";
import User from "../src/models/User.js";
import Department from "../src/models/Department.js";
import Team from "../src/models/Team.js";
import JobDescription from "../src/models/JobDescription.js";
import Candidate from "../src/models/Candidate.js";
import TrainingMaterial from "../src/models/TrainingMaterial.js";
import Quizzes from "../src/models/Quizzes.js";
import MaterialQuizzes from "../src/models/MaterialQuizzes.js";
import QuizQuestion from "../src/models/QuizQuestion.js";
import QuizResult from "../src/models/QuizResult.js";
import QuizAnswer from "../src/models/QuizAnswer.js";
import Tag from "../src/models/Tag.js";
import MaterialTag from "../src/models/MaterialTag.js";
import QuestionTag from "../src/models/QuestionTag.js";
import QuizTag from "../src/models/QuizTag.js";
import QuestionToQuiz from "../src/models/QuesionToQuiz.js";
import TrainingRecord from "../src/models/TrainingRecord.js";
import PerformancePeriod from "../src/models/PerformancePeriod.js";
import Project from "../src/models/Project.js";
import Task from "../src/models/Task.js";
import TaskComment from "../src/models/TaskComment.js";
import TaskReview from "../src/models/TaskReview.js";
import Notification from "../src/models/Notification.js";
import {
    jobDescriptionSeeds,
    candidateUserSeeds,
    candidateProfileSeeds,
    tagSeeds,
    trainingMaterialSeeds,
    quizSeeds,
    materialQuizLinkSeeds,
    quizQuestionSeeds,
    questionTagLinkSeeds,
    quizTagLinkSeeds,
    questionToQuizLinkSeeds,
    trainingRecordSeeds,
    quizResultSeeds,
    quizAnswerSeeds,
    projectSeeds,
    taskSeeds,
    taskCommentSeeds,
    taskReviewSeeds,
    notificationSeeds
} from "./module-seeds.js";
import performancePeriods from "./performance-periods.js";
import { DEFAULT_TENANT_CODE } from "./tenants.js";

const SALT_ROUNDS = 10;

const createSummary = () => ({
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0
});

const toDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeTextPayload = (value) => {
    if (value == null) return null;
    if (typeof value === "string") return value;
    return JSON.stringify(value);
};

const ensureTenant = async () => {
    const tenant = await Tenant.findOne({ where: { tenant_code: DEFAULT_TENANT_CODE } });
    if (!tenant) {
        throw new Error(`Tenant not found: ${DEFAULT_TENANT_CODE}. Run seed:tenants first.`);
    }
    return tenant;
};

const getDepartmentByCode = async () => {
    const departments = await Department.findAll({ attributes: ["department_id", "code"] });
    return new Map(departments.map((department) => [department.code, department]));
};

const getTeamByCode = async () => {
    const teams = await Team.findAll({ attributes: ["team_id", "code"] });
    return new Map(teams.map((team) => [team.code, team]));
};

const getUsersByEmails = async (emails) => {
    const uniqueEmails = [...new Set(emails.filter(Boolean))];
    if (uniqueEmails.length === 0) return new Map();

    const users = await User.findAll({
        where: { company_email: { [Op.in]: uniqueEmails } },
        attributes: ["user_id", "company_email", "personal_email", "password", "role"]
    });

    return new Map(users.map((user) => [user.company_email, user]));
};

const importJobDescriptions = async ({ tenant, usersByEmail, departmentsByCode }) => {
    const summary = createSummary();
    const jobsByKey = new Map();

    for (const seed of jobDescriptionSeeds) {
        const transaction = await sequelize.transaction();
        try {
            const department = departmentsByCode.get(seed.department_code);
            const creator = usersByEmail.get(seed.created_by_email);

            if (!department || !creator) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await JobDescription.findOne({
                where: {
                    title: seed.title,
                    department_id: department.department_id,
                    employment_type: seed.employment_type,
                    experience_level: seed.experience_level
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                title: seed.title,
                location: seed.location ?? null,
                type_of_work: seed.type_of_work ?? null,
                description: seed.description,
                requirements: seed.requirements,
                responsibilities: seed.responsibilities,
                qualifications: seed.qualifications,
                experience_level: seed.experience_level,
                employment_type: seed.employment_type,
                salary_range_min: seed.salary_range_min,
                salary_range_max: seed.salary_range_max,
                status: seed.status,
                posting_date: seed.posting_date ?? null,
                closing_date: seed.closing_date ?? null,
                department_id: department.department_id,
                positions_count: seed.positions_count ?? 1,
                created_by: creator.user_id,
                is_deleted: false,
                updated_at: new Date()
            };

            let jobRecord;
            if (!existing) {
                jobRecord = await JobDescription.create(
                    {
                        ...payload,
                        created_at: new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                jobRecord = existing;
                summary.updated += 1;
            }

            jobsByKey.set(seed.key, jobRecord);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`JobDescription seed failed (${seed.key}): ${error.message}`);
        }
    }

    return { summary, jobsByKey };
};

const importCandidateUsers = async ({ tenant }) => {
    const summary = createSummary();
    const usersByEmail = new Map();

    for (const seed of candidateUserSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const existing = await User.findOne({
                where: {
                    [Op.or]: [
                        { company_email: seed.company_email },
                        { personal_email: seed.personal_email }
                    ]
                },
                transaction
            });

            let user;
            if (!existing) {
                const hashedPassword = await bcrypt.hash(seed.password, SALT_ROUNDS);
                user = await User.create(
                    {
                        tenant_id: tenant.tenant_id,
                        personal_email: seed.personal_email,
                        company_email: seed.company_email,
                        password: hashedPassword,
                        full_name: seed.full_name,
                        phone_number: seed.phone_number ?? null,
                        address: seed.address ?? null,
                        role: seed.role,
                        status: seed.status ?? "active",
                        is_deleted: false,
                        created_at: new Date(),
                        updated_at: new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(
                    {
                        tenant_id: tenant.tenant_id,
                        personal_email: seed.personal_email,
                        company_email: seed.company_email,
                        full_name: seed.full_name,
                        phone_number: seed.phone_number ?? null,
                        address: seed.address ?? null,
                        role: seed.role,
                        status: seed.status ?? "active",
                        is_deleted: false,
                        updated_at: new Date()
                    },
                    { transaction }
                );
                user = existing;
                summary.updated += 1;
            }

            usersByEmail.set(seed.company_email, user);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Candidate user seed failed (${seed.company_email}): ${error.message}`);
        }
    }

    return { summary, usersByEmail };
};

const importCandidateProfiles = async ({ tenant, candidateUsersByEmail, jobsByKey }) => {
    const summary = createSummary();
    const candidateByEmail = new Map();

    for (const seed of candidateProfileSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const user = candidateUsersByEmail.get(seed.company_email);
            const job = jobsByKey.get(seed.job_key);

            if (!user || !job) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await Candidate.findOne({
                where: {
                    user_id: user.user_id,
                    job_id: job.job_id
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                user_id: user.user_id,
                cv_file_path: seed.cv_file_path ?? null,
                candidate_status: seed.candidate_status ?? "new",
                source: seed.source ?? "other",
                apply_date: seed.apply_date,
                evaluation: seed.evaluation ?? null,
                evaluation_comment: seed.evaluation_comment ?? null,
                job_id: job.job_id,
                cover_letter: seed.cover_letter ?? null
            };

            let candidate;
            if (!existing) {
                candidate = await Candidate.create(payload, { transaction });
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                candidate = existing;
                summary.updated += 1;
            }

            candidateByEmail.set(seed.company_email, candidate);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Candidate profile seed failed (${seed.company_email}): ${error.message}`);
        }
    }

    return { summary, candidateByEmail };
};

const importTags = async ({ tenant }) => {
    const summary = createSummary();
    const tagsByName = new Map();

    for (const seed of tagSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const existing = await Tag.findOne({ where: { name: seed.name }, transaction });

            let tag;
            if (!existing) {
                tag = await Tag.create(
                    {
                        tenant_id: tenant.tenant_id,
                        name: seed.name,
                        created_at: new Date(),
                        updated_at: null
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(
                    {
                        tenant_id: tenant.tenant_id,
                        updated_at: new Date()
                    },
                    { transaction }
                );
                tag = existing;
                summary.updated += 1;
            }

            tagsByName.set(seed.name, tag);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Tag seed failed (${seed.name}): ${error.message}`);
        }
    }

    return { summary, tagsByName };
};

const importTrainingMaterials = async ({ tenant, usersByEmail }) => {
    const summary = createSummary();
    const materialsByKey = new Map();

    for (const seed of trainingMaterialSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const creator = usersByEmail.get(seed.created_by_email);
            if (!creator) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await TrainingMaterial.findOne({ where: { title: seed.title }, transaction });

            const payload = {
                tenant_id: tenant.tenant_id,
                title: seed.title,
                type: seed.type,
                content_path: seed.content_path ?? null,
                created_by: creator.user_id,
                description: seed.description ?? null,
                status: seed.status ?? "active",
                updated_at: new Date()
            };

            let material;
            if (!existing) {
                material = await TrainingMaterial.create(
                    {
                        ...payload,
                        created_at: new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                material = existing;
                summary.updated += 1;
            }

            materialsByKey.set(seed.key, material);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Training material seed failed (${seed.key}): ${error.message}`);
        }
    }

    return { summary, materialsByKey };
};

const importQuizzes = async ({ tenant, usersByEmail }) => {
    const summary = createSummary();
    const quizzesByKey = new Map();

    for (const seed of quizSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const creator = usersByEmail.get(seed.created_by_email);
            if (!creator) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await Quizzes.findOne({ where: { title: seed.title }, transaction });

            const payload = {
                tenant_id: tenant.tenant_id,
                title: seed.title,
                description: seed.description ?? null,
                duration: seed.duration,
                passing_score: seed.passing_score,
                created_by: creator.user_id,
                creation_date: seed.creation_date,
                status: seed.status ?? "active"
            };

            let quiz;
            if (!existing) {
                quiz = await Quizzes.create(payload, { transaction });
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                quiz = existing;
                summary.updated += 1;
            }

            quizzesByKey.set(seed.key, quiz);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Quiz seed failed (${seed.key}): ${error.message}`);
        }
    }

    return { summary, quizzesByKey };
};

const importMaterialQuizLinks = async ({ tenant, materialsByKey, quizzesByKey }) => {
    const summary = createSummary();

    for (const seed of materialQuizLinkSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const material = materialsByKey.get(seed.material_key);
            const quiz = quizzesByKey.get(seed.quiz_key);

            if (!material || !quiz) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await MaterialQuizzes.findOne({
                where: {
                    material_id: material.material_id,
                    quiz_id: quiz.quiz_id
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                material_id: material.material_id,
                quiz_id: quiz.quiz_id,
                is_required: seed.is_required ?? true,
                sequence_order: seed.sequence_order ?? 1
            };

            if (!existing) {
                await MaterialQuizzes.create(payload, { transaction });
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                summary.updated += 1;
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Material-Quiz link seed failed (${seed.material_key} -> ${seed.quiz_key}): ${error.message}`);
        }
    }

    return summary;
};

const importQuizQuestions = async ({ tenant, usersByEmail }) => {
    const summary = createSummary();
    const questionsByKey = new Map();

    for (const seed of quizQuestionSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const creator = usersByEmail.get(seed.created_by_email);

            const existing = await QuizQuestion.findOne({
                where: { question_text: seed.question_text },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                question_text: seed.question_text,
                question_type: seed.question_type,
                options: normalizeTextPayload(seed.options),
                correct_answer: normalizeTextPayload(seed.correct_answer),
                points: seed.points ?? 1,
                created_by: creator?.user_id ?? null,
                updated_at: new Date(),
                is_active: true
            };

            let question;
            if (!existing) {
                question = await QuizQuestion.create(
                    {
                        ...payload,
                        created_at: new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                question = existing;
                summary.updated += 1;
            }

            questionsByKey.set(seed.key, question);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Quiz question seed failed (${seed.key}): ${error.message}`);
        }
    }

    return { summary, questionsByKey };
};

const importMaterialTagLinks = async ({ tenant, tagsByName, materialsByKey }) => {
    const summary = createSummary();

    for (const seed of trainingMaterialSeeds) {
        const material = materialsByKey.get(seed.key);
        if (!material) {
            summary.skipped += 1;
            continue;
        }

        const candidateTags = [];
        if (seed.key.includes("ONBOARD")) candidateTags.push("onboarding", "communication");
        if (seed.key.includes("SECURE")) candidateTags.push("security", "backend", "devops");
        if (seed.key.includes("HR")) candidateTags.push("hr-policy", "recruitment");
        if (seed.key.includes("LMS")) candidateTags.push("onboarding");

        for (const tagName of candidateTags) {
            const tag = tagsByName.get(tagName);
            if (!tag) {
                summary.skipped += 1;
                continue;
            }

            const transaction = await sequelize.transaction();
            try {
                const existing = await MaterialTag.findOne({
                    where: {
                        material_id: material.material_id,
                        tag_id: tag.tag_id
                    },
                    transaction
                });

                if (!existing) {
                    await MaterialTag.create(
                        {
                            tenant_id: tenant.tenant_id,
                            material_id: material.material_id,
                            tag_id: tag.tag_id
                        },
                        { transaction }
                    );
                    summary.created += 1;
                } else {
                    summary.updated += 1;
                }

                await transaction.commit();
            } catch (error) {
                await transaction.rollback();
                summary.failed += 1;
                console.error(`Material tag seed failed (${seed.key} -> ${tagName}): ${error.message}`);
            }
        }
    }

    return summary;
};

const importQuestionTagLinks = async ({ tenant, questionsByKey, tagsByName }) => {
    const summary = createSummary();

    for (const seed of questionTagLinkSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const question = questionsByKey.get(seed.question_key);
            const tag = tagsByName.get(seed.tag_name);

            if (!question || !tag) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await QuestionTag.findOne({
                where: {
                    question_id: question.question_id,
                    tag_id: tag.tag_id
                },
                transaction
            });

            if (!existing) {
                await QuestionTag.create(
                    {
                        tenant_id: tenant.tenant_id,
                        question_id: question.question_id,
                        tag_id: tag.tag_id
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                summary.updated += 1;
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Question tag seed failed (${seed.question_key} -> ${seed.tag_name}): ${error.message}`);
        }
    }

    return summary;
};

const importQuizTagLinks = async ({ tenant, quizzesByKey, tagsByName }) => {
    const summary = createSummary();

    for (const seed of quizTagLinkSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const quiz = quizzesByKey.get(seed.quiz_key);
            const tag = tagsByName.get(seed.tag_name);

            if (!quiz || !tag) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await QuizTag.findOne({
                where: {
                    quiz_id: quiz.quiz_id,
                    tag_id: tag.tag_id
                },
                transaction
            });

            if (!existing) {
                await QuizTag.create(
                    {
                        tenant_id: tenant.tenant_id,
                        quiz_id: quiz.quiz_id,
                        tag_id: tag.tag_id,
                        created_at: new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                summary.updated += 1;
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Quiz tag seed failed (${seed.quiz_key} -> ${seed.tag_name}): ${error.message}`);
        }
    }

    return summary;
};

const importQuestionToQuizLinks = async ({ tenant, quizzesByKey, questionsByKey, tagsByName }) => {
    const summary = createSummary();

    for (const seed of questionToQuizLinkSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const quiz = quizzesByKey.get(seed.quiz_key);
            const question = questionsByKey.get(seed.question_key);
            const tag = tagsByName.get(seed.tag_name);

            if (!quiz || !question || !tag) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await QuestionToQuiz.findOne({
                where: {
                    question_id: question.question_id,
                    quiz_id: quiz.quiz_id
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                question_id: question.question_id,
                quiz_id: quiz.quiz_id,
                tag_id: tag.tag_id,
                question_order: seed.question_order ?? 1,
                points_override: seed.points_override ?? null,
                is_active: true,
                added_by: quiz.created_by ?? null
            };

            if (!existing) {
                await QuestionToQuiz.create(
                    {
                        ...payload,
                        added_at: new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                summary.updated += 1;
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Question-To-Quiz seed failed (${seed.question_key} -> ${seed.quiz_key}): ${error.message}`);
        }
    }

    return summary;
};

const importTrainingRecords = async ({ tenant, usersByEmail, materialsByKey }) => {
    const summary = createSummary();

    for (const seed of trainingRecordSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const user = usersByEmail.get(seed.user_email);
            const material = materialsByKey.get(seed.material_key);

            if (!user || !material) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await TrainingRecord.findOne({
                where: {
                    user_id: user.user_id,
                    material_id: material.material_id
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                user_id: user.user_id,
                material_id: material.material_id,
                start_date: seed.start_date,
                completion_date: seed.completion_date ?? null,
                status: seed.status,
                progress: seed.progress ?? 0,
                updated_at: new Date()
            };

            if (!existing) {
                await TrainingRecord.create(
                    {
                        ...payload,
                        created_at: toDate(seed.start_date) ?? new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                summary.updated += 1;
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Training record seed failed (${seed.user_email} -> ${seed.material_key}): ${error.message}`);
        }
    }

    return summary;
};

const importQuizResults = async ({ tenant, usersByEmail, quizzesByKey }) => {
    const summary = createSummary();
    const resultByCompositeKey = new Map();

    for (const seed of quizResultSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const user = usersByEmail.get(seed.user_email);
            const quiz = quizzesByKey.get(seed.quiz_key);

            if (!user || !quiz) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await QuizResult.findOne({
                where: {
                    user_id: user.user_id,
                    quiz_id: quiz.quiz_id,
                    attempt_number: seed.attempt_number
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                user_id: user.user_id,
                quiz_id: quiz.quiz_id,
                score: seed.score ?? null,
                pass_status: seed.pass_status ?? null,
                completion_time: seed.completion_time ?? null,
                attempt_number: seed.attempt_number,
                completion_date: seed.completion_date
            };

            let result;
            if (!existing) {
                result = await QuizResult.create(
                    {
                        ...payload,
                        created_at: toDate(seed.completion_date) ?? new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                result = existing;
                summary.updated += 1;
            }

            const compositeKey = `${seed.user_email}|${seed.quiz_key}|${seed.attempt_number}`;
            resultByCompositeKey.set(compositeKey, result);

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Quiz result seed failed (${seed.user_email} -> ${seed.quiz_key} #${seed.attempt_number}): ${error.message}`);
        }
    }

    return { summary, resultByCompositeKey };
};

const importQuizAnswers = async ({ tenant, resultByCompositeKey, questionsByKey }) => {
    const summary = createSummary();

    for (const seed of quizAnswerSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const compositeKey = `${seed.user_email}|${seed.quiz_key}|${seed.attempt_number}`;
            const result = resultByCompositeKey.get(compositeKey);
            const question = questionsByKey.get(seed.question_key);

            if (!result || !question) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await QuizAnswer.findOne({
                where: {
                    result_id: result.result_id,
                    question_id: question.question_id
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                result_id: result.result_id,
                question_id: question.question_id,
                answer: normalizeTextPayload(seed.answer),
                correct: seed.correct ?? null,
                score: seed.score ?? null
            };

            if (!existing) {
                await QuizAnswer.create(payload, { transaction });
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                summary.updated += 1;
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Quiz answer seed failed (${seed.question_key}): ${error.message}`);
        }
    }

    return summary;
};

const importProjects = async ({ tenant, usersByEmail, departmentsByCode }) => {
    const summary = createSummary();
    const projectsByKey = new Map();

    for (const seed of projectSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const manager = usersByEmail.get(seed.manager_email);
            const department = seed.department_code ? departmentsByCode.get(seed.department_code) : null;

            if (!manager) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await Project.findOne({
                where: {
                    tenant_id: tenant.tenant_id,
                    name: seed.name
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                name: seed.name,
                goal: seed.goal ?? null,
                description: seed.description ?? null,
                manager_id: manager.user_id,
                department_id: department?.department_id ?? null,
                start_date: seed.start_date ?? null,
                end_date: seed.end_date ?? null,
                status: seed.status ?? "to_do",
                active: seed.active ?? true,
                updated_at: new Date()
            };

            let project;
            if (!existing) {
                project = await Project.create(
                    {
                        ...payload,
                        created_at: new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                project = existing;
                summary.updated += 1;
            }

            projectsByKey.set(seed.key, project);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Project seed failed (${seed.key}): ${error.message}`);
        }
    }

    return { summary, projectsByKey };
};

const importTasks = async ({ tenant, projectsByKey, teamsByCode, usersByEmail }) => {
    const summary = createSummary();
    const tasksByKey = new Map();

    for (const seed of taskSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const project = projectsByKey.get(seed.project_key);
            const team = seed.team_code ? teamsByCode.get(seed.team_code) : null;
            const assignee = usersByEmail.get(seed.assigned_to_email);
            const creator = usersByEmail.get(seed.created_by_email);
            const parentTask = seed.parent_task_key ? tasksByKey.get(seed.parent_task_key) : null;

            if (!project || !assignee || !creator) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await Task.findOne({
                where: {
                    tenant_id: tenant.tenant_id,
                    project_id: project.project_id,
                    title: seed.title
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                project_id: project.project_id,
                parent_task_id: parentTask?.task_id ?? null,
                team_id: team?.team_id ?? null,
                title: seed.title,
                description: seed.description ?? null,
                assigned_to: assignee.user_id,
                created_by: creator.user_id,
                start_date: seed.start_date ?? null,
                due_date: seed.due_date ?? null,
                completed_date: seed.completed_date ?? null,
                status: seed.status ?? "to_do",
                priority: seed.priority ?? "medium",
                active: seed.active ?? true,
                updated_at: new Date()
            };

            let task;
            if (!existing) {
                task = await Task.create(
                    {
                        ...payload,
                        created_at: new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                task = existing;
                summary.updated += 1;
            }

            tasksByKey.set(seed.key, task);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Task seed failed (${seed.key}): ${error.message}`);
        }
    }

    return { summary, tasksByKey };
};

const importTaskComments = async ({ tenant, tasksByKey, usersByEmail }) => {
    const summary = createSummary();

    for (const seed of taskCommentSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const task = tasksByKey.get(seed.task_key);
            const user = usersByEmail.get(seed.user_email);

            if (!task || !user) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await TaskComment.findOne({
                where: {
                    task_id: task.task_id,
                    user_id: user.user_id,
                    comment: seed.comment
                },
                transaction
            });

            if (!existing) {
                await TaskComment.create(
                    {
                        tenant_id: tenant.tenant_id,
                        task_id: task.task_id,
                        user_id: user.user_id,
                        comment: seed.comment,
                        created_at: toDate(seed.created_at) ?? new Date(),
                        updated_at: null
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update({ updated_at: new Date() }, { transaction });
                summary.updated += 1;
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Task comment seed failed (${seed.task_key}): ${error.message}`);
        }
    }

    return summary;
};

const importTaskReviews = async ({ tenant, tasksByKey, usersByEmail }) => {
    const summary = createSummary();

    for (const seed of taskReviewSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const task = tasksByKey.get(seed.task_key);
            const reviewer = usersByEmail.get(seed.reviewer_email);
            const reviewedUser = usersByEmail.get(seed.reviewed_user_email);

            if (!task || !reviewer || !reviewedUser) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            const existing = await TaskReview.findOne({
                where: {
                    task_id: task.task_id,
                    reviewer_id: reviewer.user_id,
                    reviewed_user_id: reviewedUser.user_id
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                task_id: task.task_id,
                reviewer_id: reviewer.user_id,
                reviewed_user_id: reviewedUser.user_id,
                decision: seed.decision,
                note: seed.note ?? null,
                updated_at: new Date()
            };

            if (!existing) {
                await TaskReview.create(
                    {
                        ...payload,
                        created_at: new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                summary.updated += 1;
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Task review seed failed (${seed.task_key}): ${error.message}`);
        }
    }

    return summary;
};

const getPeriodByKey = async () => {
    const periodMap = new Map();
    for (const seed of performancePeriods) {
        const period = await PerformancePeriod.findOne({
            where: {
                period_name: seed.period_name,
                start_date: seed.start_date
            }
        });

        if (period) {
            periodMap.set(seed.key, period);
        }
    }

    return periodMap;
};

const importNotifications = async ({
    tenant,
    usersByEmail,
    tasksByKey,
    candidateByEmail,
    periodByKey
}) => {
    const summary = createSummary();

    for (const seed of notificationSeeds) {
        const transaction = await sequelize.transaction();

        try {
            const recipient = usersByEmail.get(seed.recipient_email);
            const actor = seed.actor_email ? usersByEmail.get(seed.actor_email) : null;

            if (!recipient) {
                summary.skipped += 1;
                await transaction.rollback();
                continue;
            }

            let entityId = null;
            if (seed.entity_ref?.kind === "task") {
                const task = tasksByKey.get(seed.entity_ref.key);
                entityId = task?.task_id ?? null;
            }
            if (seed.entity_ref?.kind === "candidate") {
                const candidate = candidateByEmail.get(seed.entity_ref.email);
                entityId = candidate?.candidate_info_id ?? null;
            }
            if (seed.entity_ref?.kind === "period") {
                const period = periodByKey.get(seed.entity_ref.key);
                entityId = period?.period_id ?? null;
            }

            const existing = await Notification.findOne({
                where: {
                    tenant_id: tenant.tenant_id,
                    user_id: recipient.user_id,
                    type: seed.type,
                    title: seed.title,
                    entity_type: seed.entity_type ?? null,
                    entity_id: entityId
                },
                transaction
            });

            const payload = {
                tenant_id: tenant.tenant_id,
                user_id: recipient.user_id,
                actor_id: actor?.user_id ?? null,
                type: seed.type,
                title: seed.title,
                message: seed.message,
                entity_type: seed.entity_type ?? null,
                entity_id: entityId,
                metadata: seed.metadata ?? null,
                is_read: seed.is_read ?? false,
                read_at: seed.is_read ? (toDate(seed.read_at) ?? new Date()) : null,
                updated_at: new Date()
            };

            if (!existing) {
                await Notification.create(
                    {
                        ...payload,
                        created_at: new Date()
                    },
                    { transaction }
                );
                summary.created += 1;
            } else {
                await existing.update(payload, { transaction });
                summary.updated += 1;
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Notification seed failed (${seed.type} -> ${seed.recipient_email}): ${error.message}`);
        }
    }

    return summary;
};

const flattenSeedEmails = () => {
    const emails = new Set();

    const add = (value) => {
        if (value) emails.add(value);
    };

    for (const seed of jobDescriptionSeeds) add(seed.created_by_email);
    for (const seed of candidateUserSeeds) add(seed.company_email);
    for (const seed of trainingMaterialSeeds) add(seed.created_by_email);
    for (const seed of quizSeeds) add(seed.created_by_email);
    for (const seed of trainingRecordSeeds) add(seed.user_email);
    for (const seed of quizResultSeeds) add(seed.user_email);
    for (const seed of projectSeeds) add(seed.manager_email);
    for (const seed of taskSeeds) {
        add(seed.assigned_to_email);
        add(seed.created_by_email);
    }
    for (const seed of taskCommentSeeds) add(seed.user_email);
    for (const seed of taskReviewSeeds) {
        add(seed.reviewer_email);
        add(seed.reviewed_user_email);
    }
    for (const seed of notificationSeeds) {
        add(seed.recipient_email);
        add(seed.actor_email);
    }

    return [...emails];
};

try {
    const tenant = await ensureTenant();

    const baseEmails = flattenSeedEmails();
    const usersByEmail = await getUsersByEmails(baseEmails);

    const departmentsByCode = await getDepartmentByCode();
    const teamsByCode = await getTeamByCode();

    const { summary: jdSummary, jobsByKey } = await importJobDescriptions({
        tenant,
        usersByEmail,
        departmentsByCode
    });

    const { summary: candidateUserSummary, usersByEmail: candidateUsersByEmail } = await importCandidateUsers({ tenant });

    for (const [email, user] of candidateUsersByEmail.entries()) {
        usersByEmail.set(email, user);
    }

    const { summary: candidateProfileSummary, candidateByEmail } = await importCandidateProfiles({
        tenant,
        candidateUsersByEmail,
        jobsByKey
    });

    const { summary: tagSummary, tagsByName } = await importTags({ tenant });

    const { summary: materialSummary, materialsByKey } = await importTrainingMaterials({ tenant, usersByEmail });
    const { summary: quizSummary, quizzesByKey } = await importQuizzes({ tenant, usersByEmail });

    const materialQuizSummary = await importMaterialQuizLinks({ tenant, materialsByKey, quizzesByKey });

    const { summary: questionSummary, questionsByKey } = await importQuizQuestions({ tenant, usersByEmail });
    const materialTagSummary = await importMaterialTagLinks({ tenant, tagsByName, materialsByKey });
    const questionTagSummary = await importQuestionTagLinks({ tenant, questionsByKey, tagsByName });
    const quizTagSummary = await importQuizTagLinks({ tenant, quizzesByKey, tagsByName });
    const questionToQuizSummary = await importQuestionToQuizLinks({
        tenant,
        quizzesByKey,
        questionsByKey,
        tagsByName
    });

    const trainingRecordSummary = await importTrainingRecords({ tenant, usersByEmail, materialsByKey });
    const { summary: quizResultSummary, resultByCompositeKey } = await importQuizResults({
        tenant,
        usersByEmail,
        quizzesByKey
    });
    const quizAnswerSummary = await importQuizAnswers({ tenant, resultByCompositeKey, questionsByKey });

    const { summary: projectSummary, projectsByKey } = await importProjects({
        tenant,
        usersByEmail,
        departmentsByCode
    });
    const { summary: taskSummary, tasksByKey } = await importTasks({
        tenant,
        projectsByKey,
        teamsByCode,
        usersByEmail
    });
    const taskCommentSummary = await importTaskComments({ tenant, tasksByKey, usersByEmail });
    const taskReviewSummary = await importTaskReviews({ tenant, tasksByKey, usersByEmail });

    const periodByKey = await getPeriodByKey();
    const notificationSummary = await importNotifications({
        tenant,
        usersByEmail,
        tasksByKey,
        candidateByEmail,
        periodByKey
    });

    console.log("\n=== Module seed summary ===");
    console.log(`Job descriptions -> created: ${jdSummary.created}, updated: ${jdSummary.updated}, skipped: ${jdSummary.skipped}, failed: ${jdSummary.failed}`);
    console.log(`Candidate users -> created: ${candidateUserSummary.created}, updated: ${candidateUserSummary.updated}, skipped: ${candidateUserSummary.skipped}, failed: ${candidateUserSummary.failed}`);
    console.log(`Candidate profiles -> created: ${candidateProfileSummary.created}, updated: ${candidateProfileSummary.updated}, skipped: ${candidateProfileSummary.skipped}, failed: ${candidateProfileSummary.failed}`);
    console.log(`Tags -> created: ${tagSummary.created}, updated: ${tagSummary.updated}, skipped: ${tagSummary.skipped}, failed: ${tagSummary.failed}`);
    console.log(`Training materials -> created: ${materialSummary.created}, updated: ${materialSummary.updated}, skipped: ${materialSummary.skipped}, failed: ${materialSummary.failed}`);
    console.log(`Quizzes -> created: ${quizSummary.created}, updated: ${quizSummary.updated}, skipped: ${quizSummary.skipped}, failed: ${quizSummary.failed}`);
    console.log(`Material-quiz links -> created: ${materialQuizSummary.created}, updated: ${materialQuizSummary.updated}, skipped: ${materialQuizSummary.skipped}, failed: ${materialQuizSummary.failed}`);
    console.log(`Quiz questions -> created: ${questionSummary.created}, updated: ${questionSummary.updated}, skipped: ${questionSummary.skipped}, failed: ${questionSummary.failed}`);
    console.log(`Material tags -> created: ${materialTagSummary.created}, updated: ${materialTagSummary.updated}, skipped: ${materialTagSummary.skipped}, failed: ${materialTagSummary.failed}`);
    console.log(`Question tags -> created: ${questionTagSummary.created}, updated: ${questionTagSummary.updated}, skipped: ${questionTagSummary.skipped}, failed: ${questionTagSummary.failed}`);
    console.log(`Quiz tags -> created: ${quizTagSummary.created}, updated: ${quizTagSummary.updated}, skipped: ${quizTagSummary.skipped}, failed: ${quizTagSummary.failed}`);
    console.log(`Question-to-quiz links -> created: ${questionToQuizSummary.created}, updated: ${questionToQuizSummary.updated}, skipped: ${questionToQuizSummary.skipped}, failed: ${questionToQuizSummary.failed}`);
    console.log(`Training records -> created: ${trainingRecordSummary.created}, updated: ${trainingRecordSummary.updated}, skipped: ${trainingRecordSummary.skipped}, failed: ${trainingRecordSummary.failed}`);
    console.log(`Quiz results -> created: ${quizResultSummary.created}, updated: ${quizResultSummary.updated}, skipped: ${quizResultSummary.skipped}, failed: ${quizResultSummary.failed}`);
    console.log(`Quiz answers -> created: ${quizAnswerSummary.created}, updated: ${quizAnswerSummary.updated}, skipped: ${quizAnswerSummary.skipped}, failed: ${quizAnswerSummary.failed}`);
    console.log(`Projects -> created: ${projectSummary.created}, updated: ${projectSummary.updated}, skipped: ${projectSummary.skipped}, failed: ${projectSummary.failed}`);
    console.log(`Tasks -> created: ${taskSummary.created}, updated: ${taskSummary.updated}, skipped: ${taskSummary.skipped}, failed: ${taskSummary.failed}`);
    console.log(`Task comments -> created: ${taskCommentSummary.created}, updated: ${taskCommentSummary.updated}, skipped: ${taskCommentSummary.skipped}, failed: ${taskCommentSummary.failed}`);
    console.log(`Task reviews -> created: ${taskReviewSummary.created}, updated: ${taskReviewSummary.updated}, skipped: ${taskReviewSummary.skipped}, failed: ${taskReviewSummary.failed}`);
    console.log(`Notifications -> created: ${notificationSummary.created}, updated: ${notificationSummary.updated}, skipped: ${notificationSummary.skipped}, failed: ${notificationSummary.failed}`);
} catch (error) {
    console.error("Module seed import failed:", error);
    process.exitCode = 1;
} finally {
    await sequelize.close();
}

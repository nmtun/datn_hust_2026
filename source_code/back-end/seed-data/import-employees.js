import bcrypt from 'bcrypt';
import sequelize from '../src/config/dbsetup.js';
import '../src/models/associations.js';
import User from '../src/models/User.js';
import Employee from '../src/models/Employee.js';
import Department from '../src/models/Department.js';
import Team from '../src/models/Team.js';
import employees from './employees.js';

const SALT_ROUNDS = 10;

const DEPARTMENT_SEEDS = [
    {
        code: 'HR',
        name: 'Phòng Nhân sự',
        description: 'Quản lý nhân sự, tuyển dụng và đào tạo'
    },
    {
        code: 'TECH',
        name: 'Phòng Kỹ thuật',
        description: 'Phát triển và vận hành sản phẩm kỹ thuật'
    },
    {
        code: 'BIZ',
        name: 'Phòng Kinh doanh',
        description: 'Kinh doanh, tư vấn và chăm sóc khách hàng'
    }
];

const TEAM_SEEDS = [
    {
        code: 'HR-1',
        name: 'Nhóm Nhân sự 1',
        department_code: 'HR',
        leader_email: 'hr_lead1@company.com',
        description: 'Nhóm tuyển dụng và vận hành nhân sự'
    },
    {
        code: 'HR-2',
        name: 'Nhóm Nhân sự 2',
        department_code: 'HR',
        leader_email: 'hr_lead2@company.com',
        description: 'Nhóm C&B và đào tạo'
    },
    {
        code: 'TECH-1',
        name: 'Nhóm Kỹ thuật 1',
        department_code: 'TECH',
        leader_email: 'tech_lead1@company.com',
        description: 'Nhóm phát triển sản phẩm 1'
    },
    {
        code: 'TECH-2',
        name: 'Nhóm Kỹ thuật 2',
        department_code: 'TECH',
        leader_email: 'tech_lead2@company.com',
        description: 'Nhóm phát triển sản phẩm 2'
    },
    {
        code: 'BIZ-1',
        name: 'Nhóm Kinh doanh 1',
        department_code: 'BIZ',
        leader_email: 'biz_lead1@company.com',
        description: 'Nhóm bán hàng và tư vấn 1'
    },
    {
        code: 'BIZ-2',
        name: 'Nhóm Kinh doanh 2',
        department_code: 'BIZ',
        leader_email: 'biz_lead2@company.com',
        description: 'Nhóm bán hàng và tư vấn 2'
    }
];

const DEPARTMENT_MANAGER_EMAIL_BY_CODE = {
    HR: 'hr_head@company.com',
    TECH: 'tech_head@company.com',
    BIZ: 'biz_head@company.com'
};

const buildUserPayload = (employeeData, password) => ({
    personal_email: employeeData.personal_email,
    company_email: employeeData.company_email,
    password,
    full_name: employeeData.full_name,
    phone_number: employeeData.phone_number,
    address: employeeData.address,
    role: employeeData.role ?? 'employee',
    status: employeeData.status ?? 'active',
    is_deleted: false
});

const buildEmployeePayload = (employeeData, userId) => ({
    user_id: userId,
    hire_date: employeeData.hire_date,
    position: employeeData.position,
    department_id: employeeData.department_id ?? null,
    team_id: employeeData.team_id ?? null,
    manager_id: employeeData.manager_id ?? null,
    termination_date: employeeData.termination_date ?? null,
    employee_id_number: employeeData.employee_id_number ?? null
});

const getUsersByEmailMap = async (transaction) => {
    const users = await User.findAll({
        attributes: ['user_id', 'company_email'],
        transaction
    });

    return new Map(users.map((user) => [user.company_email, user]));
};

const upsertDepartments = async (transaction) => {
    const departmentsByCode = new Map();
    let created = 0;
    let updated = 0;

    for (const seed of DEPARTMENT_SEEDS) {
        const existingDepartment = await Department.findOne({
            where: { code: seed.code },
            transaction
        });

        if (!existingDepartment) {
            const department = await Department.create(
                {
                    name: seed.name,
                    code: seed.code,
                    description: seed.description,
                    manager_id: null,
                    parent_department_id: null,
                    active: true,
                    created_at: new Date()
                },
                { transaction }
            );

            departmentsByCode.set(seed.code, department);
            created += 1;
            continue;
        }

        await existingDepartment.update(
            {
                name: seed.name,
                description: seed.description,
                active: true,
                updated_at: new Date()
            },
            { transaction }
        );

        departmentsByCode.set(seed.code, existingDepartment);
        updated += 1;
    }

    return { departmentsByCode, created, updated };
};

const assignDepartmentManagers = async ({ transaction, departmentsByCode, usersByEmail }) => {
    let assigned = 0;

    for (const [departmentCode, managerEmail] of Object.entries(DEPARTMENT_MANAGER_EMAIL_BY_CODE)) {
        const department = departmentsByCode.get(departmentCode);
        const managerUser = usersByEmail.get(managerEmail);
        if (!department || !managerUser) {
            continue;
        }

        await department.update(
            {
                manager_id: managerUser.user_id,
                updated_at: new Date()
            },
            { transaction }
        );

        assigned += 1;
    }

    return assigned;
};

const upsertTeams = async ({ transaction, departmentsByCode, usersByEmail }) => {
    const teamsByCode = new Map();
    let created = 0;
    let updated = 0;

    for (const seed of TEAM_SEEDS) {
        const department = departmentsByCode.get(seed.department_code);
        if (!department) {
            continue;
        }

        const leaderUser = usersByEmail.get(seed.leader_email);

        const payload = {
            name: seed.name,
            code: seed.code,
            department_id: department.department_id,
            leader_id: leaderUser?.user_id ?? null,
            description: seed.description,
            active: true,
            updated_at: new Date()
        };

        const existingTeam = await Team.findOne({
            where: { code: seed.code },
            transaction
        });

        if (!existingTeam) {
            const team = await Team.create(
                {
                    ...payload,
                    created_at: new Date()
                },
                { transaction }
            );

            teamsByCode.set(seed.code, team);
            created += 1;
            continue;
        }

        await existingTeam.update(payload, { transaction });
        teamsByCode.set(seed.code, existingTeam);
        updated += 1;
    }

    return { teamsByCode, created, updated };
};

const resolveEmployeeOrgReferences = ({ employeeData, usersByEmail, departmentsByCode, teamsByCode }) => {
    const departmentByCode = employeeData.department_code
        ? departmentsByCode.get(employeeData.department_code)
        : null;
    const teamByCode = employeeData.team_code
        ? teamsByCode.get(employeeData.team_code)
        : null;
    const managerByEmail = employeeData.manager_company_email
        ? usersByEmail.get(employeeData.manager_company_email)
        : null;

    return {
        department_id: employeeData.department_id
            ?? teamByCode?.department_id
            ?? departmentByCode?.department_id
            ?? null,
        team_id: employeeData.team_id
            ?? teamByCode?.team_id
            ?? null,
        manager_id: employeeData.manager_id
            ?? managerByEmail?.user_id
            ?? null
    };
};

const syncEmployeeHierarchy = async ({ transaction, usersByEmail, departmentsByCode, teamsByCode }) => {
    let synced = 0;

    for (const employeeData of employees) {
        const user = usersByEmail.get(employeeData.company_email);
        if (!user) {
            continue;
        }

        const employeeInfo = await Employee.findOne({
            where: { user_id: user.user_id },
            transaction
        });

        if (!employeeInfo) {
            continue;
        }

        const orgRefs = resolveEmployeeOrgReferences({
            employeeData,
            usersByEmail,
            departmentsByCode,
            teamsByCode
        });

        await employeeInfo.update(orgRefs, { transaction });
        synced += 1;
    }

    return synced;
};

const syncOrganizationStructure = async () => {
    const transaction = await sequelize.transaction();

    try {
        const { departmentsByCode, created: departmentsCreated, updated: departmentsUpdated } = await upsertDepartments(transaction);
        const usersByEmail = await getUsersByEmailMap(transaction);
        const departmentManagersAssigned = await assignDepartmentManagers({
            transaction,
            departmentsByCode,
            usersByEmail
        });
        const { teamsByCode, created: teamsCreated, updated: teamsUpdated } = await upsertTeams({
            transaction,
            departmentsByCode,
            usersByEmail
        });
        const employeeHierarchySynced = await syncEmployeeHierarchy({
            transaction,
            usersByEmail,
            departmentsByCode,
            teamsByCode
        });

        await transaction.commit();

        return {
            departmentsCreated,
            departmentsUpdated,
            departmentManagersAssigned,
            teamsCreated,
            teamsUpdated,
            employeeHierarchySynced
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const importEmployees = async () => {
    const summary = {
        usersCreated: 0,
        usersUpdated: 0,
        employeeInfosCreated: 0,
        employeeInfosUpdated: 0,
        failed: 0
    };

    for (const employeeData of employees) {
        const transaction = await sequelize.transaction();

        try {
            const existingUser = await User.findOne({
                where: { company_email: employeeData.company_email },
                transaction
            });

            let user;

            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(employeeData.password, SALT_ROUNDS);
                const userPayload = buildUserPayload(employeeData, hashedPassword);
                user = await User.create(userPayload, { transaction });
                summary.usersCreated += 1;
            } else {
                const userPayload = buildUserPayload(employeeData, existingUser.password);
                await existingUser.update(userPayload, { transaction });
                user = existingUser;
                summary.usersUpdated += 1;
            }

            const existingEmployeeInfo = await Employee.findOne({
                where: { user_id: user.user_id },
                transaction
            });

            const employeePayload = buildEmployeePayload(employeeData, user.user_id);

            if (!existingEmployeeInfo) {
                await Employee.create(employeePayload, { transaction });
                summary.employeeInfosCreated += 1;
            } else {
                await existingEmployeeInfo.update(employeePayload, { transaction });
                summary.employeeInfosUpdated += 1;
            }

            await transaction.commit();
            console.log(`Imported: ${employeeData.company_email}`);
        } catch (error) {
            await transaction.rollback();
            summary.failed += 1;
            console.error(`Failed: ${employeeData.company_email} -> ${error.message}`);
        }
    }

    return summary;
};

try {
    const summary = await importEmployees();
    const orgSummary = await syncOrganizationStructure();

    console.log('\n=== Import summary ===');
    console.log(`Users created: ${summary.usersCreated}`);
    console.log(`Users updated: ${summary.usersUpdated}`);
    console.log(`Employee info created: ${summary.employeeInfosCreated}`);
    console.log(`Employee info updated: ${summary.employeeInfosUpdated}`);
    console.log(`Failed: ${summary.failed}`);
    console.log('\n=== Organization sync summary ===');
    console.log(`Departments created: ${orgSummary.departmentsCreated}`);
    console.log(`Departments updated: ${orgSummary.departmentsUpdated}`);
    console.log(`Department managers assigned: ${orgSummary.departmentManagersAssigned}`);
    console.log(`Teams created: ${orgSummary.teamsCreated}`);
    console.log(`Teams updated: ${orgSummary.teamsUpdated}`);
    console.log(`Employee hierarchy synced: ${orgSummary.employeeHierarchySynced}`);
} catch (error) {
    console.error('Import process failed:', error);
    process.exitCode = 1;
} finally {
    await sequelize.close();
}

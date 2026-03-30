import bcrypt from 'bcrypt';
import sequelize from '../src/config/dbsetup.js';
import '../src/models/associations.js';
import User from '../src/models/User.js';
import Employee from '../src/models/Employee.js';
import employees from './employees.js';

const SALT_ROUNDS = 10;

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

    console.log('\n=== Import summary ===');
    console.log(`Users created: ${summary.usersCreated}`);
    console.log(`Users updated: ${summary.usersUpdated}`);
    console.log(`Employee info created: ${summary.employeeInfosCreated}`);
    console.log(`Employee info updated: ${summary.employeeInfosUpdated}`);
    console.log(`Failed: ${summary.failed}`);
} catch (error) {
    console.error('Import process failed:', error);
    process.exitCode = 1;
} finally {
    await sequelize.close();
}

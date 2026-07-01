import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import Employee from "../models/Employee.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import sequelize from "../config/dbsetup.js";

const ROLE_VALUES = ['employee', 'hr', 'manager', 'tenant_admin'];
const STATUS_VALUES = ['active', 'on_leave', 'terminated'];

const isTruthyFlag = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
    }
    return false;
};

const sanitizeUser = (user) => {
    if (!user) return null;
    const data = user.get ? user.get({ plain: true }) : user;
    const { password, ...safeData } = data;
    return safeData;
};

const buildEmailLikeWhere = (email) => {
    if (!email) return null;
    return {
        [Op.or]: [
            { personal_email: { [Op.like]: `%${email}%` } },
            { company_email: { [Op.like]: `%${email}%` } }
        ]
    };
};

// Create user service
export const createUserService = async (userData) => {
    return await User.create(userData);
};  

export const findUserByEmailService = async (email) => {
    if (!email) return null;
    return await User.findOne({
        where: {
            [Op.or]: [
                { personal_email: email },
                { company_email: email }
            ]
        }
    });
};

export const findTenantByCodeService = async (tenantCode) => {
    if (!tenantCode) return null;

    return await Tenant.findOne({
        where: {
            tenant_code: tenantCode,
            is_deleted: false
        }
    });
};

export const findUserByEmailExcludingUserService = async (email, excludeUserId) => {
    if (!email) return null;
    const where = {
        [Op.or]: [
            { personal_email: email },
            { company_email: email }
        ]
    };
    if (excludeUserId) {
        where.user_id = { [Op.ne]: excludeUserId };
    }
    return await User.findOne({ where });
};

export const createAdminUserService = async (userData = {}, requestingUser = null) => {
    try {
        const {
            personal_email,
            company_email,
            password,
            full_name,
            phone_number,
            address,
            position,
            role = 'employee',
            status = 'active',
            tenant_id
        } = userData;

        if (!personal_email) return { status: 400, data: { error: true, message: "Personal email is required" } };
        if (!password) return { status: 400, data: { error: true, message: "Password is required" } };
        if (!full_name) return { status: 400, data: { error: true, message: "Full name is required" } };

        if (!ROLE_VALUES.includes(role)) {
            return { status: 400, data: { error: true, message: "Invalid role" } };
        }
        if (!STATUS_VALUES.includes(status)) {
            return { status: 400, data: { error: true, message: "Invalid status" } };
        }

        if (role === 'tenant_admin' && !company_email) {
            return { status: 400, data: { error: true, message: "Company email is required for tenant admin" } };
        }

        const requesterRole = requestingUser?.role || null;
        const requesterTenantId = requestingUser?.tenant_id ?? null;

        if (requesterRole === 'tenant_admin' && (requesterTenantId === undefined || requesterTenantId === null)) {
            return { status: 403, data: { error: true, message: "Tenant scope missing" } };
        }

        let resolvedTenantId = tenant_id;
        if (requesterRole === 'tenant_admin') {
            if (tenant_id && Number(tenant_id) !== Number(requesterTenantId)) {
                return { status: 403, data: { error: true, message: "Tenant mismatch" } };
            }
            resolvedTenantId = requesterTenantId;
        }

        if (resolvedTenantId === undefined || resolvedTenantId === null || resolvedTenantId === '') {
            return { status: 400, data: { error: true, message: "Tenant is required" } };
        }

        const normalizedTenantId = Number(resolvedTenantId);
        if (!Number.isInteger(normalizedTenantId)) {
            return { status: 400, data: { error: true, message: "Invalid tenant" } };
        }

        const tenant = await Tenant.findOne({ where: { tenant_id: normalizedTenantId, is_deleted: false } });
        if (!tenant) {
            return { status: 404, data: { error: true, message: "Tenant not found" } };
        }

        const existingPersonal = await findUserByEmailService(personal_email);
        if (existingPersonal) {
            return { status: 409, data: { error: true, message: "Personal email already exists" } };
        }

        if (company_email) {
            const existingCompany = await findUserByEmailService(company_email);
            if (existingCompany) {
                return { status: 409, data: { error: true, message: "Company email already exists" } };
            }
        }
        const transaction = await sequelize.transaction();

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                personal_email,
                company_email: company_email || null,
                password: hashedPassword,
                full_name,
                phone_number,
                address,
                role,
                status,
                tenant_id: normalizedTenantId
            }, { transaction });

            const shouldCreateEmployeeInfo = ['employee', 'hr', 'manager'].includes(role);
            if (shouldCreateEmployeeInfo) {
                const normalizedPosition = typeof position === 'string' ? position.trim() : position;
                await Employee.create({
                    tenant_id: normalizedTenantId,
                    user_id: user.user_id,
                    hire_date: new Date(),
                    position: normalizedPosition || null,
                    department_id: null,
                    team_id: null,
                    manager_id: null,
                    termination_date: null,
                    employee_id_number: null
                }, { transaction });
            }

            await transaction.commit();

            return {
                status: 201,
                data: {
                    error: false,
                    message: "User created successfully",
                    user: sanitizeUser(user)
                }
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error in createAdminUserService:', error);
        return {
            status: 500,
            data: { error: true, message: "Internal server error", details: error.message }
        };
    }
};

export const getAllUsersService = async (query = {}, requestingUser = null) => {
    try {
        const { full_name, email, role, status, include_deleted, tenant_id } = query;

        const where = {};
        if (!isTruthyFlag(include_deleted)) {
            where.is_deleted = false;
        }

        where.role = { [Op.notIn]: ['tenant_admin', 'super_admin'] }; // Exclude tenant admin and super admin users from the list

        if (requestingUser?.role === 'tenant_admin') {
            const scopedTenantId = requestingUser.tenant_id;
            if (scopedTenantId === undefined || scopedTenantId === null) {
                return { status: 403, data: { error: true, message: "Tenant scope missing" } };
            }
            where.tenant_id = scopedTenantId;
        } else if (tenant_id !== undefined && tenant_id !== null && tenant_id !== '') {
            const normalizedTenantId = Number(tenant_id);
            if (!Number.isInteger(normalizedTenantId)) {
                return { status: 400, data: { error: true, message: "Invalid tenant" } };
            }
            where.tenant_id = normalizedTenantId;
        }

        if (full_name) where.full_name = { [Op.like]: `%${full_name}%` };

        if (role) {
            if (!ROLE_VALUES.includes(role)) {
                return { status: 400, data: { error: true, message: "Invalid role" } };
            }
            where.role = role;
        }

        if (status) {
            if (!STATUS_VALUES.includes(status)) {
                return { status: 400, data: { error: true, message: "Invalid status" } };
            }
            where.status = status;
        }

        const emailWhere = buildEmailLikeWhere(email);
        if (emailWhere) {
            Object.assign(where, emailWhere);
        }

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']]
        });

        return {
            status: 200,
            data: { error: false, message: "Users retrieved successfully", users }
        };
    } catch (error) {
        console.error('Error in getAllUsersService:', error);
        return {
            status: 500,
            data: { error: true, message: "Internal server error", details: error.message }
        };
    }
};

export const getUserByIdService = async (userId, includeDeleted = false) => {
    try {
        const where = { user_id: userId };
        if (!isTruthyFlag(includeDeleted)) where.is_deleted = false;

        const user = await User.findOne({
            where,
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return { status: 404, data: { error: true, message: "User not found" } };
        }

        return {
            status: 200,
            data: { error: false, message: "User retrieved successfully", user }
        };
    } catch (error) {
        console.error('Error in getUserByIdService:', error);
        return {
            status: 500,
            data: { error: true, message: "Internal server error", details: error.message }
        };
    }
};

export const updateUserService = async (userId, updateData = {}) => {
    try {
        const user = await User.findOne({ where: { user_id: userId, is_deleted: false } });
        if (!user) {
            return { status: 404, data: { error: true, message: "User not found" } };
        }

        const updatePayload = {};
        const {
            personal_email,
            company_email,
            password,
            full_name,
            phone_number,
            address,
            role,
            status,
            tenant_id
        } = updateData;

        if (personal_email !== undefined) {
            if (!personal_email) {
                return { status: 400, data: { error: true, message: "Personal email is required" } };
            }
            const existing = await findUserByEmailExcludingUserService(personal_email, userId);
            if (existing) {
                return { status: 409, data: { error: true, message: "Personal email already exists" } };
            }
            updatePayload.personal_email = personal_email;
        }

        if (company_email !== undefined) {
            const normalizedCompanyEmail = company_email ? company_email : null;
            if (normalizedCompanyEmail) {
                const existing = await findUserByEmailExcludingUserService(normalizedCompanyEmail, userId);
                if (existing) {
                    return { status: 409, data: { error: true, message: "Company email already exists" } };
                }
            }
            updatePayload.company_email = normalizedCompanyEmail;
        }

        if (full_name !== undefined) updatePayload.full_name = full_name;
        if (phone_number !== undefined) updatePayload.phone_number = phone_number;
        if (address !== undefined) updatePayload.address = address;

        if (role !== undefined) {
            if (!ROLE_VALUES.includes(role)) {
                return { status: 400, data: { error: true, message: "Invalid role" } };
            }
            updatePayload.role = role;
        }

        if (status !== undefined) {
            if (!STATUS_VALUES.includes(status)) {
                return { status: 400, data: { error: true, message: "Invalid status" } };
            }
            updatePayload.status = status;
        }

        if (tenant_id !== undefined) {
            if (tenant_id === null || tenant_id === '') {
                updatePayload.tenant_id = null;
            } else {
                const normalizedTenantId = Number(tenant_id);
                if (!Number.isInteger(normalizedTenantId)) {
                    return { status: 400, data: { error: true, message: "Invalid tenant" } };
                }

                const tenant = await Tenant.findOne({ where: { tenant_id: normalizedTenantId, is_deleted: false } });
                if (!tenant) {
                    return { status: 404, data: { error: true, message: "Tenant not found" } };
                }

                updatePayload.tenant_id = normalizedTenantId;
            }
        } else if (role === 'tenant_admin' && !user.tenant_id) {
            return { status: 400, data: { error: true, message: "Tenant is required for tenant admin" } };
        }

        if (password !== undefined) {
            if (!password) {
                return { status: 400, data: { error: true, message: "Password is required" } };
            }
            updatePayload.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(updatePayload).length === 0) {
            return { status: 400, data: { error: true, message: "No valid fields to update" } };
        }

        await user.update(updatePayload);

        return {
            status: 200,
            data: {
                error: false,
                message: "User updated successfully",
                user: sanitizeUser(user)
            }
        };
    } catch (error) {
        console.error('Error in updateUserService:', error);
        return {
            status: 500,
            data: { error: true, message: "Internal server error", details: error.message }
        };
    }
};

export const deleteUserService = async (userId) => {
    try {
        const user = await User.findOne({ where: { user_id: userId, is_deleted: false } });
        if (!user) {
            return { status: 404, data: { error: true, message: "User not found" } };
        }

        await user.update({ is_deleted: true, status: 'terminated' });
        return {
            status: 200,
            data: { error: false, message: "User deleted successfully" }
        };
    } catch (error) {
        console.error('Error in deleteUserService:', error);
        return {
            status: 500,
            data: { error: true, message: "Internal server error", details: error.message }
        };
    }
};

export const restoreUserService = async (userId) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return { status: 404, data: { error: true, message: "User not found" } };
        }

        if (!user.is_deleted) {
            return { status: 400, data: { error: true, message: "User is not deleted" } };
        }

        await user.update({ is_deleted: false });

        return {
            status: 200,
            data: {
                error: false,
                message: "User restored successfully",
                user: sanitizeUser(user)
            }
        };
    } catch (error) {
        console.error('Error in restoreUserService:', error);
        return {
            status: 500,
            data: { error: true, message: "Internal server error", details: error.message }
        };
    }
};

export const getAdminProfileService = async (userId) => {
    try {
        const user = await User.findOne({
            where: { user_id: userId, is_deleted: false },
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return { status: 404, data: { error: true, message: "User not found" } };
        }
        return {
            status: 200,
            data: { error: false, message: "Admin profile retrieved successfully", user }
        };
    } catch (error) {
        console.error('Error in getAdminProfileService:', error);
        return {
            status: 500,
            data: { error: true, message: "Internal server error", details: error.message }
        };
    }
};

export const updateAdminProfileService = async (userId, updateData = {}) => {
    try {
        const user = await User.findOne({ where: { user_id: userId, is_deleted: false } });
        if (!user) {
            return { status: 404, data: { error: true, message: "User not found" } };
        }
        const updatePayload = {};
        const {
            phone_number,
            address
        } = updateData;
        if (phone_number !== undefined) updatePayload.phone_number = phone_number;
        if (address !== undefined) updatePayload.address = address;
        if (Object.keys(updatePayload).length === 0) {
            return { status: 400, data: { error: true, message: "No valid fields to update" } };
        }
        await user.update(updatePayload);
        return {
            status: 200,
            data: {
                error: false,
                message: "Admin profile updated successfully",
                user: sanitizeUser(user)
            }
        };
    }
    catch (error) {
        console.error('Error in updateAdminProfileService:', error);
        return {
            status: 500,
            data: { error: true, message: "Internal server error", details: error.message }
        };
    }
};

export const createSuperAdminService = async (data) => {
    const { personal_email, password, full_name, phone_number, address, role } = data;
    if (!personal_email || !password || !full_name) {
        throw new Error("Missing required fields: personal_email, password, full_name");
    }
    const existing = await findUserByEmailService(personal_email);
    if (existing) {
        throw new Error("User with this personal email already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdmin = await createUserService({
        personal_email,
        company_email: null,
        password: hashedPassword,
        full_name,
        phone_number,
        address,
        role,
        status: 'active',
        is_deleted: false
    });
    return {
        status: 201,
        data: {
            error: false,
            message: "Super admin created successfully",
            user: sanitizeUser(superAdmin)
        }
    }
}

export const changePasswordService = async(data) => {
    const { user_id, old_password, new_password } = data;
    if (!old_password || !new_password) {
        return { status: 400, data: { error: true, message: "Missing required fields: user_id, old_password, new_password" } };
    }

    const user = await User.findOne({ where: { user_id, is_deleted: false } });
    if (!user) {
        return { status: 404, data: { error: true, message: "User not found" } };
    }

    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
        return { status: 400, data: { error: true, message: "Old password is incorrect" } };
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashedNewPassword });
    return {
        status: 200,
        data: { error: false, message: "Password changed successfully" }
    };
}
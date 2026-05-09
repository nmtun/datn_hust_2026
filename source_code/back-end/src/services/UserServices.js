import User from "../models/User.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";

const ROLE_VALUES = ['employee', 'hr', 'manager', 'admin'];
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

export const createAdminUserService = async (userData = {}) => {
    try {
        const {
            personal_email,
            company_email,
            password,
            full_name,
            phone_number,
            address,
            role = 'employee',
            status = 'active'
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

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await createUserService({
            personal_email,
            company_email: company_email || null,
            password: hashedPassword,
            full_name,
            phone_number,
            address,
            role,
            status
        });

        return {
            status: 201,
            data: {
                error: false,
                message: "User created successfully",
                user: sanitizeUser(user)
            }
        };
    } catch (error) {
        console.error('Error in createAdminUserService:', error);
        return {
            status: 500,
            data: { error: true, message: "Internal server error", details: error.message }
        };
    }
};

export const getAllUsersService = async (query = {}) => {
    try {
        const { full_name, email, role, status, include_deleted } = query;

        const where = {};
        if (!isTruthyFlag(include_deleted)) {
            where.is_deleted = false;
        }

        where.role = { [Op.ne]: 'admin' }; // Exclude admin users from the list

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
            status
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

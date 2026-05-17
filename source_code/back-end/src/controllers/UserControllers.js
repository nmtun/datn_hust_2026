import * as userService from '../services/UserServices.js';
import { resolveHierarchyRole } from '../services/HierarchyServices.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    try {
        const { company_email, password, tenant_code } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!company_email) {
            return res.status(400).json({
                error: true,
                message: "Email is required"
            });
        }

        if (!password) {
            return res.status(400).json({
                error: true,
                message: "Password is required"
            });
        }

        // Check user
        const user = await userService.findUserByEmailService(company_email);

        if (!user) {
            return res.status(404).json({
                error: true,
                message: "User not found"
            });
        }

        // Nếu không phải super admin thì bắt buộc tenant_code
        if (user.role !== 'super_admin' && !tenant_code) {
            return res.status(400).json({
                error: true,
                message: "Tenant code is required"
            });
        }

        // Validate tenant
        if (user.role !== 'super_admin') {

            const tenant = await userService.findTenantByCodeService(tenant_code);

            if (!tenant) {
                return res.status(404).json({
                    error: true,
                    message: "Tenant not found"
                });
            }

            if (user.tenant_id !== tenant.tenant_id) {
                return res.status(403).json({
                    error: true,
                    message: "Tenant code does not match account"
                });
            }
        }

        // Check status
        if (user.status === 'terminated') {
            return res.status(403).json({
                error: true,
                message: "Your account has been terminated. Please contact support for more information."
            });
        }

        if (user.is_deleted) {
            return res.status(403).json({
                error: true,
                message: "Your account has been deleted. Please contact support for more information."
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: true,
                message: "Invalid password"
            });
        }

        const hierarchyRole = await resolveHierarchyRole({
            userId: user.user_id,
            role: user.role
        });

        // Create token
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role,
                hierarchy_role: hierarchyRole,
                tenant_id: user.tenant_id ?? null
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            error: false,
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                role: user.role,
                hierarchy_role: hierarchyRole,
                tenant_id: user.tenant_id ?? null
            }
        });

    } catch (error) {
        console.error("Error during login:", error);

        return res.status(500).json({
            error: true,
            message: "Internal server error"
        });
    }
};

export const createUser = async (req, res) => {
    try {
        const result = await userService.createAdminUserService(req.body, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const result = await userService.getAllUsersService(req.query, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting users:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getUserById = async (req, res) => {
    try {
        const result = await userService.getUserByIdService(req.params.id, req.query.include_deleted);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting user:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const result = await userService.updateUserService(req.params.id, req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const result = await userService.deleteUserService(req.params.id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const restoreUser = async (req, res) => {
    try {
        const result = await userService.restoreUserService(req.params.id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error restoring user:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAdminProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const admin = await userService.getAdminProfileService(userId);
        if (!admin) {
            return res.status(404).json({ error: true, message: "Admin not found" });
        }
        return res.status(200).json({ error: false, data: admin });
    }
    catch (error) {
        console.error("Error getting admin profile:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateAdminProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await userService.updateAdminProfileService(userId, req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating admin profile:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const createSuperAdmin = async (req, res) => {
    try {
        const result = await userService.createSuperAdminService(req.body);
        return res.status(result.status).json(result.data);
    }
    catch (error) {
        console.error("Error creating super admin:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
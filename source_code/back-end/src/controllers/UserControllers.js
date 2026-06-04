import * as userService from '../services/UserServices.js';
import { resolveHierarchyRole } from '../services/HierarchyServices.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendEmailFromSuperAdmin } from '../utils/sendEmail.js';
import Tenant from '../models/Tenant.js';

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

            if (tenant.status === 'inactive') {
                return res.status(403).json({
                    error: true,
                    message: "Tenant is inactive. Please contact support for more information."
                });
            }

            if (tenant.status === 'suspended') {
                return res.status(403).json({
                    error: true,
                    message: "Tenant is suspended. Please contact support for more information."
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

        if (
            result.status === 201
            && req.user?.role === 'super_admin'
            && req.body?.role === 'tenant_admin'
        ) {
            const notificationEmail = req.body.personal_email;
            if (notificationEmail) {
                let tenantCode = req.body.tenant_code;
                const resolvedTenantId = result?.data?.user?.tenant_id ?? req.body.tenant_id;

                if (!tenantCode && resolvedTenantId !== undefined && resolvedTenantId !== null && resolvedTenantId !== '') {
                    try {
                        const tenant = await Tenant.findOne({
                            where: {
                                tenant_id: Number(resolvedTenantId),
                                is_deleted: false
                            }
                        });
                        tenantCode = tenant?.tenant_code;
                    } catch (tenantError) {
                        console.error('Failed to resolve tenant code:', tenantError);
                    }
                }

                const subject = "Tenant admin account created";
                const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login`;
                const htmlContent = `
                    <h2>Hello ${req.body.full_name},</h2>
                    <p>Your tenant admin account has been created by the super admin.</p>

                    <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.375rem; padding: 1rem; margin: 1rem 0;">
                        <p><strong>Company Email:</strong> ${req.body.company_email}</p>
                        <p><strong>Tenant Code:</strong> ${tenantCode || 'N/A'}</p>
                        <p><strong>Password:</strong> ${req.body.password}</p>
                    </div>

                    <p>Please sign in at: <a href="${loginUrl}">${loginUrl}</a></p>
                    <p>Please change your password after the first login.</p>

                    <br/>
                    <p>Regards,<br/>Super Admin</p>
                `;

                try {
                    await sendEmailFromSuperAdmin(notificationEmail, subject, htmlContent);
                } catch (emailError) {
                    console.error('Failed to send tenant admin account email:', emailError);
                }
            } else {
                console.warn('No email available to notify tenant admin account creation.');
            }
        }

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
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { runWithRequestContext } from '../utils/requestContext.js';

dotenv.config();

/**
 * Middleware để xác thực người dùng dựa trên JWT token
 * và phân quyền truy cập dựa trên vai trò của người dùng.
 */

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Không có token" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!Object.prototype.hasOwnProperty.call(decoded, 'tenant_id')) {
            return res.status(401).json({ message: "Token thiếu tenant_id" });
        }
        if (decoded.role !== 'super_admin' && (decoded.tenant_id === null || decoded.tenant_id === undefined)) {
            return res.status(401).json({ message: "Token thiếu tenant_id" });
        }

        req.user = decoded; // { user_id, role, tenant_id }

        return runWithRequestContext({
            tenantId: decoded.tenant_id,
            role: decoded.role,
            userId: decoded.user_id ?? decoded.userId ?? null
        }, () => next());
    } catch (err) {
        res.status(401).json({ message: "Token không hợp lệ" });
    }
};

// Optional auth: decode token when present, but still allow anonymous requests.
export const authenticateOptional = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!Object.prototype.hasOwnProperty.call(decoded, 'tenant_id')) {
            req.user = null;
            return next();
        }
        if (decoded.role !== 'super_admin' && (decoded.tenant_id === null || decoded.tenant_id === undefined)) {
            req.user = null;
            return next();
        }
        req.user = decoded; // { user_id, role, tenant_id }
        return runWithRequestContext({
            tenantId: decoded.tenant_id,
            role: decoded.role,
            userId: decoded.user_id ?? decoded.userId ?? null
        }, () => next());
    } catch (err) {
        // Ignore invalid optional token and continue as unauthenticated.
        req.user = null;
        return next();
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Không có quyền truy cập" });
        }
        next();
    };
};

// Middleware xác thực cho phép token từ query string (dùng cho download/streaming)
export const authenticateWithQuery = (req, res, next) => {
    // Kiểm tra token từ header trước
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (req.query.token) {
        // Nếu không có trong header, lấy từ query string
        token = req.query.token;
    }
    
    if (!token) {
        return res.status(401).json({ message: "Không có token" });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!Object.prototype.hasOwnProperty.call(decoded, 'tenant_id')) {
            return res.status(401).json({ message: "Token thiếu tenant_id" });
        }
        if (decoded.role !== 'super_admin' && (decoded.tenant_id === null || decoded.tenant_id === undefined)) {
            return res.status(401).json({ message: "Token thiếu tenant_id" });
        }
        req.user = decoded; // { user_id, role, tenant_id }
        return runWithRequestContext({
            tenantId: decoded.tenant_id,
            role: decoded.role,
            userId: decoded.user_id ?? decoded.userId ?? null
        }, () => next());
    } catch (err) {
        res.status(401).json({ message: "Token không hợp lệ" });
    }
};
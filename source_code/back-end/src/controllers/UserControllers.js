import * as userService from '../services/UserServices.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    try{
        const { company_email, password } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!company_email) return res.status(400).json({ error: true, message: "Email is required" });
        if (!password) return res.status(400).json({ error: true, message: "Password is required" });

        // Check email 
        const user = await userService.findUserByEmailService(company_email);
        if (!user) return res.status(404).json({ error: true, message: "User not found" });

        // So sánh mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: true, message: "Invalid password" });

        // Tạo token
        const token = jwt.sign(
            { 
                user_id: user.user_id,
                role: user.role
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.status(200).json({
            error: false,
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                role: user.role
            },
        });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
}

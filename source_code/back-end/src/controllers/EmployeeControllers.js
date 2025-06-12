import * as employeeService from '../services/EmployeeServices.js';
import * as userService from '../services/UserServices.js';
import bcrypt from 'bcrypt';

export const createEmployee = async (req, res) => {
    try {
        const { 
            personal_email,
            company_email,
            password,
            full_name,
            phone_number,
            address,
            role,
            hire_date = new Date(),
            position = "Nhân viên",
            termination_date = null,
            employee_id_number = "NV001"
        } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!personal_email) return res.status(400).json({ error: true, message: "Personal email is required" });
        if (!company_email) return res.status(400).json({ error: true, message: "Company email is required" });
        if (!password) return res.status(400).json({ error: true, message: "Password is required" });
        if (!full_name) return res.status(400).json({ error: true, message: "Full name is required" });
        if (!phone_number) return res.status(400).json({ error: true, message: "Phone number is required" });
        if (!address) return res.status(400).json({ error: true, message: "Address is required" });
        if (!role) return res.status(400).json({ error: true, message: "Role is required" });

        // Kiểm tra email đã tồn tại
        const existingUser = await userService.findUserByEmail(personal_email);
        if (existingUser) return res.status(409).json({ error: true, message: "Personal email already exists" });

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng
        const user = await userService.createUser({
            personal_email,
            company_email,
            password: hashedPassword,
            full_name,
            phone_number,
            address,
            role,
        });

        // Tạo nhân viên
        const employee = await employeeService.createEmployee({
            user_id: user.user_id,
            hire_date,
            position,
            termination_date,
            employee_id_number
        });

        res.status(201).json({
            error: false,
            message: "Employee created successfully",
            user,
            employee
        });

    } catch (error) {
        console.error("Error creating employee:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
}
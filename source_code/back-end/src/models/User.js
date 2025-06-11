import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const User = sequelize.define("Users", {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    personal_email: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    company_email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    full_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    role: {
        type: DataTypes.ENUM("Ứng viên", "Nhân viên", "Nhân sự", "Quản lý", "admin"),
        defaultValue: "Ứng viên",
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("Đang hoạt động", "Đã nghỉ việc"),
        defaultValue: "Đang hoạt động",
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    }
}, {
    tableName: "Users",
    timestamps: false,
    underscored: true,
});

export default User;
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
        type: DataTypes.ENUM("guest", "candidate", "emoloyee", "hr", "manager"),
        defaultValue: "guest",
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("active", "on_leave", "terminated"),
        defaultValue: "active",
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
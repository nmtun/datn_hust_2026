import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const Tenant = sequelize.define("Tenants", {
    tenant_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tenant_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    tenant_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    subdomain: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    company_email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
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
        allowNull: false,    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    timestamps: false,
    tableName: "Tenants",
});

export default Tenant;
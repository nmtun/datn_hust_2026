import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const Department = sequelize.define("Department", {
    department_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Tenants",
            key: "tenant_id"
        }
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    manager_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Users",
            key: "user_id"
        }
    },
    parent_department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Departments",
            key: "department_id"
        }
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: "Departments",
    timestamps: false
});

export default Department;

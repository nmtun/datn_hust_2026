import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const Compensation = sequelize.define("Compensation", {
    comp_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Users",
            key: "user_id"
        }
    },
    salary: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false
    },
    bonus: {
        type: DataTypes.DECIMAL(18, 2),
        defaultValue: 0
    },
    effective_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Users",
            key: "user_id"
        }
    },
    approved_at: {
        type: DataTypes.DATE,
        allowNull: false
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
    tableName: "Compensation",
    timestamps: false
});

export default Compensation;

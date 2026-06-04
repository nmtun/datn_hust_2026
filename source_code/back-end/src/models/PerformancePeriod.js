import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const PerformancePeriod = sequelize.define("PerformancePeriod", {
    period_id: {
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
    period_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM("planned", "in_progress", "completed"),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    tableName: "Performance_Periods",
    timestamps: false
});

export default PerformancePeriod;

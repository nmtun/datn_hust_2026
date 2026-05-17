import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const HRForecast = sequelize.define("HRForecast", {
    forecast_id: {
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
    period: {
        type: DataTypes.STRING(100)
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Departments",
            key: "department_id"
        }
    },
    current_headcount: {
        type: DataTypes.INTEGER
    },
    predicted_needs: {
        type: DataTypes.INTEGER
    },
    creation_date: {
        type: DataTypes.DATEONLY
    },
    notes: {
        type: DataTypes.TEXT
    }
}, {
    tableName: "HR_Forecasts",
    timestamps: false
});

export default HRForecast;

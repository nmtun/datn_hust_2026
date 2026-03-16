import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const Performance = sequelize.define("Performance", {
    perf_id: {
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
    period_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Performance_Periods",
            key: "period_id"
        }
    },
    kpi_goals: {
        type: DataTypes.TEXT
    },
    achievement: {
        type: DataTypes.TEXT
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    feedback: {
        type: DataTypes.TEXT
    },
    review_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    reviewer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Users",
            key: "user_id"
        }
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
    tableName: "Performance",
    timestamps: false
});

export default Performance;

import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const TrainingRecord = sequelize.define("Training_Records", {
    record_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Users",
            key: "user_id",
        },
    },
    material_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Training_Materials",
            key: "material_id",
        },
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    completion_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
        allowNull: false,
        defaultValue: 'not_started',
    },
    progress: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: "Training_Records",
    timestamps: false,
    underscored: true,
});

export default TrainingRecord;
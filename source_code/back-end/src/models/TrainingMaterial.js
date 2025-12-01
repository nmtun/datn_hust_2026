import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const TrainingMaterial = sequelize.define("Training_Materials", {
    material_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('video', 'document', 'both'),
        allowNull: false,
    },
    content_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Users",
            key: "user_id",
        },
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'draft', 'archived'),
        defaultValue: "active",
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "Training_Materials",
    timestamps: false,
    underscored: true,
    hooks: {
        beforeUpdate: (material) => {
            material.updated_at = new Date();
        }
    }
});

export default TrainingMaterial;
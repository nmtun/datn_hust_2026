import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const Quizzes = sequelize.define("Quizzes", {
    quiz_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    passing_score: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Users",
            key: "user_id",
        },
    },
    creation_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    status: {
        type: DataTypes.ENUM('active', 'draft', 'archived'),
        defaultValue: "active",
    },
}, {
    tableName: "Quizzes",
    timestamps: false,
    underscored: true,
});

export default Quizzes;
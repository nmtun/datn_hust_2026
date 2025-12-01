import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const QuizResult = sequelize.define("Quiz_Results", {
    result_id: {
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
    quiz_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Quizzes",
            key: "quiz_id",
        },
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    pass_status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    completion_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Completion time in seconds',
    },
    attempt_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    completion_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "Quiz_Results",
    timestamps: false,
    underscored: true,
});

export default QuizResult;
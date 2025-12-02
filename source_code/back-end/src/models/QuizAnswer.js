import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const QuizAnswer = sequelize.define("Quiz_Answers", {
    answer_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    result_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Quiz_Results",
            key: "result_id",
        },
    },
    question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Quiz_Questions",
            key: "question_id",
        },
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    correct: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
}, {
    tableName: "Quiz_Answers",
    timestamps: false,
    underscored: true,
});

export default QuizAnswer;
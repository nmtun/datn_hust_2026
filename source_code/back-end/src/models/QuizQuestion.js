import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const QuizQuestion = sequelize.define("Quiz_Questions", {
    question_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    quiz_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Quizzes",
            key: "quiz_id",
        },
    },
    question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    question_type: {
        type: DataTypes.ENUM('multiple_choice', 'true_false'),
        allowNull: false,
    },
    options: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    correct_answer: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    points: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1.0,
    },
}, {
    tableName: "Quiz_Questions",
    timestamps: false,
    underscored: true,
});

export default QuizQuestion;
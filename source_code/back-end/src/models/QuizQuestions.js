import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const QuizQuestions = sequelize.define("Quiz_Questions_Bridge", {
    id: {
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
    question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Quiz_Questions",
            key: "question_id",
        },
    },
    order_index: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
}, {
    tableName: "Quiz_Questions_Bridge",
    timestamps: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['quiz_id', 'question_id']
        }
    ]
});

export default QuizQuestions;
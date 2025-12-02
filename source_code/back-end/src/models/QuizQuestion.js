import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const QuizQuestion = sequelize.define("Quiz_Questions", {
    question_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    question_type: {
        type: DataTypes.ENUM('multiple_choice', 'multiple_response', 'true_false'),
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Users",
            key: "user_id",
        },
        comment: "Người tạo câu hỏi"
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Trạng thái kích hoạt câu hỏi"
    },
}, {
    tableName: "Quiz_Questions",
    timestamps: false,
    underscored: true,
});

export default QuizQuestion;
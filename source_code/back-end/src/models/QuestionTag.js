import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const QuestionTag = sequelize.define("Question_Tags", {
    question_tag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Quiz_Questions",
            key: "question_id",
        },
    },
    tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Tags",
            key: "tag_id",
        },
    },
}, {
    tableName: "Question_Tags",
    timestamps: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['question_id', 'tag_id']
        }
    ]
});

export default QuestionTag;
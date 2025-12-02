import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const QuizTag = sequelize.define("QuizTags", {
    quiz_tag_id: {
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Tags",
            key: "tag_id",
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "QuizTags",
    timestamps: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['quiz_id', 'tag_id']
        }
    ]
});

export default QuizTag;
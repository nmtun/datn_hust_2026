import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const MaterialQuizzes = sequelize.define("Material_Quizzes", {
    material_quiz_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    material_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Training_Materials",
            key: "material_id",
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
    is_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    sequence_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    tableName: "Material_Quizzes",
    timestamps: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['material_id', 'quiz_id']
        }
    ]
});

export default MaterialQuizzes;
import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const MaterialTag = sequelize.define("Material_Tags", {
    material_tag_id: {
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
    tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Tags",
            key: "tag_id",
        },
    },
}, {
    tableName: "Material_Tags",
    timestamps: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['material_id', 'tag_id']
        }
    ]
});

export default MaterialTag;
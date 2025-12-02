import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const Tag = sequelize.define("Tags", {
    tag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: "Tags",
    timestamps: false,
    underscored: true,
});

export default Tag;
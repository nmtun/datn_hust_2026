import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const Candidate = sequelize.define("Candidate", {
    candidate_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Users", 
            key: "user_id"
        }
    },
    cv_file_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    candidate_status: {
        type: DataTypes.ENUM("Mới", "Sàng lọc", "Phỏng vấn", "Đề nghị", "Đã nhận", "Loại"),
        defaultValue: "Mới",
        allowNull: false,
    },
    source_of_application: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    apply_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    evalution: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    // job_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     references: {
    //         model: "Job_Descriptions", 
    //         key: "job_id"
    //     }
    // },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: "Candidate",
    timestamps: false,
    underscored: true,
});

export default Candidate;
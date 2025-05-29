import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const CandidateInfo = sequelize.define("Candidate_Info", {
    candidate_info_id: {
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
        type: DataTypes.ENUM("new", "screening", "interview", "offered", "hired", "rejected"),
        defaultValue: "new",
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
    tableName: "Candidate_Info",
    timestamps: false,
    underscored: true,
});

export default CandidateInfo;
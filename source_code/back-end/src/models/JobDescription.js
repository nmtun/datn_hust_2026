import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const JobDescription = sequelize.define("Job_Descriptions", {
    job_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    type_of_work: {
        type: DataTypes.ENUM('on-site', 'remote', 'hybrid'),
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    requirements: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    responsibilities: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    qualifications: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    experience_level: {
        type: DataTypes.ENUM('intern', 'fresher', 'mid', 'senior', 'manager'),
        allowNull: false,
    },
    employment_type: {
        type: DataTypes.ENUM('full-time', 'part-time'),
        allowNull: false,
    },
    salary_range_min: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
    },
    salary_range_max: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('draft', 'active', 'paused', 'closed'),
        allowNull: false,
    },
    posting_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    closing_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // references: {
        //     model: 'Departments',
        //     key: 'department_id'
        // }
    },
    positions_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'user_id'
        }
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'Job_Descriptions',
    timestamps: false,
    underscored: true, 
});

export default JobDescription;

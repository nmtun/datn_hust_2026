import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const Task = sequelize.define("Task", {
    task_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Projects",
            key: "project_id"
        }
    },
    parent_task_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Tasks",
            key: "task_id"
        }
    },
    team_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Teams",
            key: "team_id"
        }
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    assigned_to: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Users",
            key: "user_id"
        }
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Users",
            key: "user_id"
        }
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('to_do', 'doing', 'review', 'done'),
        allowNull: false,
        defaultValue: 'to_do'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: "Tasks",
    timestamps: false
});

export default Task;

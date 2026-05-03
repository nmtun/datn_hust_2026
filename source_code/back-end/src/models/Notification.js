import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const Notification = sequelize.define("Notification", {
    notification_id: {
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
    actor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Users",
            key: "user_id"
        }
    },
    type: {
        type: DataTypes.ENUM(
            'task_assigned',
            'task_reassigned',
            'task_status_changed',
            'task_commented',
            'task_reviewed',
            'task_updated',
            'candidate_applied',
            'performance_period_created',
            'performance_review_reminder',
            'compensation_recommendation'
        ),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true
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
    tableName: "Notifications",
    timestamps: false
});

export default Notification;

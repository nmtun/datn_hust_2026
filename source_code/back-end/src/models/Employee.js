import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const Employee = sequelize.define("Employee", {
    employee_info_id: {
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
    hire_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    }, 
    position: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    // department_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     references: {
    //         model: "Departments", 
    //         key: "department_id"
    //     }
    // },
    // team_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     references: {
    //         model: "Teams", 
    //         key: "team_id"
    //     }
    // },
    // manager_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     references: {
    //         model: "Users", 
    //         key: "user_id"
    //     }
    // },
    termination_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    employee_id_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
}, {
    tableName: "Employee",
    timestamps: false,
    underscored: true,
});

export default Employee;
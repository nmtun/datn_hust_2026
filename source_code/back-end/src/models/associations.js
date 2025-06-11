import User from "./User.js";
import Candidate from "./Candidate.js";
import Employee from "./Employee.js";

// one-to-one associations
User.hasOne(Candidate, { foreignKey: "user_id" });
Candidate.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(Employee, { foreignKey: "user_id" });
Employee.belongsTo(User, { foreignKey: "user_id" });
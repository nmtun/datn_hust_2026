import User from "./User.js";
import Candidate from "./Candidate.js";
import Employee from "./Employee.js";
import JobDescription from "./JobDescription.js";

// Define one-to-many associations between User and Candidate_Info
User.hasMany(Candidate, { foreignKey: "user_id" });
Candidate.belongsTo(User, { foreignKey: "user_id" });

// Define one-to-one associations between User and Employee_Info
User.hasOne(Employee, { foreignKey: "user_id" });
Employee.belongsTo(User, { foreignKey: "user_id" });

// Define one-to-many associations between Job_Description and Candidate_Info
JobDescription.hasMany(Candidate, { foreignKey: "job_id" });
Candidate.belongsTo(JobDescription, { foreignKey: "job_id" });
import User from "./User.js";
import Candidate from "./Candidate.js";
import Employee from "./Employee.js";
import JobDescription from "./JobDescription.js";
import TrainingMaterial from "./TrainingMaterial.js";
import Quizzes from "./Quizzes.js";
import MaterialQuizzes from "./MaterialQuizzes.js";
import QuizQuestion from "./QuizQuestion.js";
import TrainingRecords from "./TrainingRecord.js";
import QuizResults from "./QuizResult.js";
import QuizAnswers from "./QuizAnswer.js";
import Tags from "./Tag.js";
import MaterialTags from "./MaterialTag.js";
import QuestionTags from "./QuestionTag.js";
import QuizTags from "./QuizTag.js";
import QuestionToQuiz from "./QuesionToQuiz.js";
import Department from "./Department.js";
import Team from "./Team.js";
import PerformancePeriod from "./PerformancePeriod.js";
import Performance from "./Performance.js";
import Compensation from "./Compensation.js";
import HRForecast from "./HRForecast.js";
import Project from "./Project.js";
import Task from "./Task.js";
import TaskComment from "./TaskComment.js";
import TaskReview from "./TaskReview.js";

// Define one-to-many associations between User and Candidate_Info
User.hasMany(Candidate, { foreignKey: "user_id" });
Candidate.belongsTo(User, { foreignKey: "user_id" });

// Define one-to-one associations between User and Employee_Info
User.hasOne(Employee, { foreignKey: "user_id" });
Employee.belongsTo(User, { foreignKey: "user_id" });

// Define one-to-many associations between Job_Description and Candidate_Info
JobDescription.hasMany(Candidate, { foreignKey: "job_id" });
Candidate.belongsTo(JobDescription, { foreignKey: "job_id" });

// User and TrainingMaterial associations
User.hasMany(TrainingMaterial, { foreignKey: "created_by", as: "createdTrainingMaterials" });
TrainingMaterial.belongsTo(User, { foreignKey: "created_by", as: "creator" });

// User and Quiz associations
User.hasMany(Quizzes, { foreignKey: "created_by", as: "createdQuizzes" });
Quizzes.belongsTo(User, { foreignKey: "created_by", as: "creator" });

// TrainingMaterial and Quiz many-to-many through MaterialQuizzes
TrainingMaterial.belongsToMany(Quizzes, { 
    through: MaterialQuizzes, 
    foreignKey: "material_id", 
    otherKey: "quiz_id",
    as: "quizzes"
});
Quizzes.belongsToMany(TrainingMaterial, { 
    through: MaterialQuizzes, 
    foreignKey: "quiz_id", 
    otherKey: "material_id",
    as: "trainingMaterials"
});

// Direct associations for MaterialQuizzes
MaterialQuizzes.belongsTo(TrainingMaterial, { foreignKey: "material_id" });
MaterialQuizzes.belongsTo(Quizzes, { foreignKey: "quiz_id" });
TrainingMaterial.hasMany(MaterialQuizzes, { foreignKey: "material_id" });
Quizzes.hasMany(MaterialQuizzes, { foreignKey: "quiz_id" });

// Quiz and QuizQuestion associations (allow NULL for question bank)
Quizzes.hasMany(QuizQuestion, { 
    foreignKey: { name: "quiz_id", allowNull: true }, 
    as: "questions",
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
});
QuizQuestion.belongsTo(Quizzes, { 
    foreignKey: { name: "quiz_id", allowNull: true }, 
    as: "quiz",
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
});

// User and TrainingRecords associations
User.hasMany(TrainingRecords, { foreignKey: "user_id", as: "trainingRecords" });
TrainingRecords.belongsTo(User, { foreignKey: "user_id", as: "user" });

// TrainingMaterial and TrainingRecords associations
TrainingMaterial.hasMany(TrainingRecords, { foreignKey: "material_id", as: "trainingRecords" });
TrainingRecords.belongsTo(TrainingMaterial, { foreignKey: "material_id", as: "trainingMaterial" });

// User and QuizResults associations
User.hasMany(QuizResults, { foreignKey: "user_id", as: "quizResults" });
QuizResults.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Quiz and QuizResults associations
Quizzes.hasMany(QuizResults, { foreignKey: "quiz_id", as: "results" });
QuizResults.belongsTo(Quizzes, { foreignKey: "quiz_id", as: "quiz" });

// QuizResults and QuizAnswers associations
QuizResults.hasMany(QuizAnswers, { foreignKey: "result_id", as: "answers" });
QuizAnswers.belongsTo(QuizResults, { foreignKey: "result_id", as: "result" });

// QuizQuestion and QuizAnswer associations
QuizQuestion.hasMany(QuizAnswers, { foreignKey: "question_id", as: "answers" });
QuizAnswers.belongsTo(QuizQuestion, { foreignKey: "question_id", as: "question" });

// TrainingMaterial and Tags many-to-many through MaterialTags
TrainingMaterial.belongsToMany(Tags, { 
    through: MaterialTags, 
    foreignKey: "material_id", 
    otherKey: "tag_id",
    as: "tags"
});
Tags.belongsToMany(TrainingMaterial, { 
    through: MaterialTags, 
    foreignKey: "tag_id", 
    otherKey: "material_id",
    as: "trainingMaterials"
});

// Direct associations for MaterialTags
MaterialTags.belongsTo(TrainingMaterial, { foreignKey: "material_id" });
MaterialTags.belongsTo(Tags, { foreignKey: "tag_id" });
TrainingMaterial.hasMany(MaterialTags, { foreignKey: "material_id" });
Tags.hasMany(MaterialTags, { foreignKey: "tag_id" });

// QuizQuestion and Tags many-to-many through QuestionTags
QuizQuestion.belongsToMany(Tags, { 
    through: QuestionTags, 
    foreignKey: "question_id", 
    otherKey: "tag_id",
    as: "tags"
});
Tags.belongsToMany(QuizQuestion, { 
    through: QuestionTags, 
    foreignKey: "tag_id", 
    otherKey: "question_id",
    as: "questions"
});

// Direct associations for QuestionTags
QuestionTags.belongsTo(QuizQuestion, { foreignKey: "question_id" });
QuestionTags.belongsTo(Tags, { foreignKey: "tag_id" });
QuizQuestion.hasMany(QuestionTags, { foreignKey: "question_id" });
Tags.hasMany(QuestionTags, { foreignKey: "tag_id" });

// QuestionToQuiz associations - Many-to-many through tags
QuestionToQuiz.belongsTo(QuizQuestion, { foreignKey: "question_id", as: "question" });
QuestionToQuiz.belongsTo(Quizzes, { foreignKey: "quiz_id", as: "quiz" });
QuestionToQuiz.belongsTo(Tags, { foreignKey: "tag_id", as: "tag" });
QuestionToQuiz.belongsTo(User, { foreignKey: "added_by", as: "addedBy" });

QuizQuestion.hasMany(QuestionToQuiz, { foreignKey: "question_id", as: "quizAssignments" });
Quizzes.hasMany(QuestionToQuiz, { foreignKey: "quiz_id", as: "questionAssignments" });
Tags.hasMany(QuestionToQuiz, { foreignKey: "tag_id", as: "questionQuizLinks" });
User.hasMany(QuestionToQuiz, { foreignKey: "added_by", as: "addedQuestionAssignments" });

// Quiz and Questions many-to-many through QuestionToQuiz with Tag constraint
Quizzes.belongsToMany(QuizQuestion, { 
    through: QuestionToQuiz, 
    foreignKey: "quiz_id", 
    otherKey: "question_id",
    as: "questionsViaTag"
});
QuizQuestion.belongsToMany(Quizzes, { 
    through: QuestionToQuiz, 
    foreignKey: "question_id", 
    otherKey: "quiz_id",
    as: "quizzesViaTag"
});

// Quizzes and Tags many-to-many through QuizTags
Quizzes.belongsToMany(Tags, { 
    through: QuizTags, 
    foreignKey: "quiz_id", 
    otherKey: "tag_id",
    as: "tags"
});
Tags.belongsToMany(Quizzes, { 
    through: QuizTags, 
    foreignKey: "tag_id", 
    otherKey: "quiz_id",
    as: "quizzes"
});

// Direct associations for QuizTags
QuizTags.belongsTo(Quizzes, { foreignKey: "quiz_id" });
QuizTags.belongsTo(Tags, { foreignKey: "tag_id" });
Quizzes.hasMany(QuizTags, { foreignKey: "quiz_id" });
Tags.hasMany(QuizTags, { foreignKey: "tag_id" });

// Department ↔ User (manager)
Department.belongsTo(User, { foreignKey: "manager_id", as: "manager" });
User.hasMany(Department, { foreignKey: "manager_id", as: "managedDepartments" });

// Department self-referential (parent ↔ children)
Department.belongsTo(Department, { foreignKey: "parent_department_id", as: "parentDepartment" });
Department.hasMany(Department, { foreignKey: "parent_department_id", as: "subDepartments" });

// Department ↔ Team
Department.hasMany(Team, { foreignKey: "department_id", as: "teams" });
Team.belongsTo(Department, { foreignKey: "department_id", as: "department" });

// Team ↔ User (leader)
Team.belongsTo(User, { foreignKey: "leader_id", as: "leader" });
User.hasMany(Team, { foreignKey: "leader_id", as: "ledTeams" });

// Employee ↔ Department
Employee.belongsTo(Department, { foreignKey: "department_id", as: "department" });
Department.hasMany(Employee, { foreignKey: "department_id", as: "employees" });

// Employee ↔ Team
Employee.belongsTo(Team, { foreignKey: "team_id", as: "team" });
Team.hasMany(Employee, { foreignKey: "team_id", as: "members" });

// Employee ↔ User (manager)
Employee.belongsTo(User, { foreignKey: "manager_id", as: "manager" });
User.hasMany(Employee, { foreignKey: "manager_id", as: "subordinates" });

// Performance ↔ User (employee)
Performance.belongsTo(User, { foreignKey: "user_id", as: "employee" });
User.hasMany(Performance, { foreignKey: "user_id", as: "performances" });

// Performance ↔ User (reviewer)
Performance.belongsTo(User, { foreignKey: "reviewer_id", as: "reviewer" });
User.hasMany(Performance, { foreignKey: "reviewer_id", as: "reviewedPerformances" });

// Performance ↔ PerformancePeriod
PerformancePeriod.hasMany(Performance, { foreignKey: "period_id", as: "performances" });
Performance.belongsTo(PerformancePeriod, { foreignKey: "period_id", as: "period" });

// Compensation ↔ User (employee)
Compensation.belongsTo(User, { foreignKey: "user_id", as: "employee" });
User.hasMany(Compensation, { foreignKey: "user_id", as: "compensations" });

// Compensation ↔ User (approver)
Compensation.belongsTo(User, { foreignKey: "approved_by", as: "approver" });
User.hasMany(Compensation, { foreignKey: "approved_by", as: "approvedCompensations" });

// HRForecast ↔ Department
HRForecast.belongsTo(Department, { foreignKey: "department_id", as: "department" });
Department.hasMany(HRForecast, { foreignKey: "department_id", as: "forecasts" });

// Project ↔ User (manager)
Project.belongsTo(User, { foreignKey: "manager_id", as: "manager" });
User.hasMany(Project, { foreignKey: "manager_id", as: "managedProjects" });

// Project ↔ Department
Project.belongsTo(Department, { foreignKey: "department_id", as: "department" });
Department.hasMany(Project, { foreignKey: "department_id", as: "projects" });

// Task ↔ Project
Task.belongsTo(Project, { foreignKey: "project_id", as: "project" });
Project.hasMany(Task, { foreignKey: "project_id", as: "tasks" });

// Task self-reference (parent ↔ sub tasks)
Task.belongsTo(Task, { foreignKey: "parent_task_id", as: "parentTask" });
Task.hasMany(Task, { foreignKey: "parent_task_id", as: "subTasks" });

// Task ↔ Team
Task.belongsTo(Team, { foreignKey: "team_id", as: "team" });
Team.hasMany(Task, { foreignKey: "team_id", as: "tasks" });

// Task ↔ User (assignee/creator)
Task.belongsTo(User, { foreignKey: "assigned_to", as: "assignee" });
User.hasMany(Task, { foreignKey: "assigned_to", as: "assignedTasks" });

Task.belongsTo(User, { foreignKey: "created_by", as: "creator" });
User.hasMany(Task, { foreignKey: "created_by", as: "createdTasks" });

// TaskComment ↔ Task/User
TaskComment.belongsTo(Task, { foreignKey: "task_id", as: "task" });
Task.hasMany(TaskComment, { foreignKey: "task_id", as: "comments" });

TaskComment.belongsTo(User, { foreignKey: "user_id", as: "author" });
User.hasMany(TaskComment, { foreignKey: "user_id", as: "taskComments" });

// TaskReview ↔ Task/User
TaskReview.belongsTo(Task, { foreignKey: "task_id", as: "task" });
Task.hasMany(TaskReview, { foreignKey: "task_id", as: "reviews" });

TaskReview.belongsTo(User, { foreignKey: "reviewer_id", as: "reviewer" });
User.hasMany(TaskReview, { foreignKey: "reviewer_id", as: "givenTaskReviews" });

TaskReview.belongsTo(User, { foreignKey: "reviewed_user_id", as: "reviewedUser" });
User.hasMany(TaskReview, { foreignKey: "reviewed_user_id", as: "receivedTaskReviews" });
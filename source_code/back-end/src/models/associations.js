import User from "./User.js";
import Candidate from "./Candidate.js";
import Employee from "./Employee.js";
import JobDescription from "./JobDescription.js";
import TrainingMaterial from "./TrainingMaterial.js";
import Quizzes from "./Quizzes.js";
import MaterialQuizzes from "./MaterialQuizzes.js";
import QuizQuestions from "./QuizQuestion.js";
import TrainingRecords from "./TrainingRecord.js";
import QuizResults from "./QuizResult.js";
import QuizAnswers from "./QuizAnswer.js";
import Tags from "./Tag.js";
import MaterialTags from "./MaterialTag.js";
import QuestionTags from "./QuestionTag.js";

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

// Quiz and QuizQuestions associations
Quizzes.hasMany(QuizQuestions, { foreignKey: "quiz_id", as: "questions" });
QuizQuestions.belongsTo(Quizzes, { foreignKey: "quiz_id", as: "quiz" });

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

// QuizQuestions and QuizAnswers associations
QuizQuestions.hasMany(QuizAnswers, { foreignKey: "question_id", as: "answers" });
QuizAnswers.belongsTo(QuizQuestions, { foreignKey: "question_id", as: "question" });

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

// QuizQuestions and Tags many-to-many through QuestionTags
QuizQuestions.belongsToMany(Tags, { 
    through: QuestionTags, 
    foreignKey: "question_id", 
    otherKey: "tag_id",
    as: "tags"
});
Tags.belongsToMany(QuizQuestions, { 
    through: QuestionTags, 
    foreignKey: "tag_id", 
    otherKey: "question_id",
    as: "questions"
});

// Direct associations for QuestionTags
QuestionTags.belongsTo(QuizQuestions, { foreignKey: "question_id" });
QuestionTags.belongsTo(Tags, { foreignKey: "tag_id" });
QuizQuestions.hasMany(QuestionTags, { foreignKey: "question_id" });
Tags.hasMany(QuestionTags, { foreignKey: "tag_id" });
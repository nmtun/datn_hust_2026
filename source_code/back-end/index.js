import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import sequelize from "./src/config/dbsetup.js";

// Import models here
import "./src/models/associations.js"; 
import "./src/models/User.js";
import "./src/models/Candidate.js";
import "./src/models/Employee.js";
import "./src/models/JobDescription.js";
import "./src/models/TrainingMaterial.js";
import "./src/models/Quizzes.js";
import "./src/models/MaterialQuizzes.js";
import "./src/models/QuizQuestion.js";
import "./src/models/TrainingRecord.js";
import "./src/models/QuizResult.js";
import "./src/models/QuizAnswer.js";
import "./src/models/Tag.js";
import "./src/models/MaterialTag.js";
import "./src/models/QuestionTag.js";
import "./src/models/QuesionToQuiz.js";
import "./src/models/Department.js";
import "./src/models/Team.js";
import "./src/models/PerformancePeriod.js";
import "./src/models/Performance.js";
import "./src/models/Compensation.js";
import "./src/models/HRForecast.js";
import "./src/models/Project.js";
import "./src/models/Task.js";
import "./src/models/TaskComment.js";
import "./src/models/TaskReview.js";

// Import routes here
import UserRoutes from "./src/routes/UserRoutes.js";
import CandidateRoutes from "./src/routes/CandidateRoutes.js";
import EmployeeRoutes from "./src/routes/EmployeeRoutes.js";
import JobDescriptionRoutes from "./src/routes/JobDescriptionRoutes.js";
import TrainingMaterialRoutes from "./src/routes/TrainingMaterialRoutes.js";
import TagRoutes from "./src/routes/TagRoutes.js";
import QuizzesRoutes from "./src/routes/QuizzesRoutes.js";
import QuizQuestionRoutes from "./src/routes/QuizQuestionRoutes.js";
import QuestionToQuizRoutes from "./src/routes/QuestionToQuizRoutes.js";
import QuizResultRoutes from "./src/routes/QuizResultRoutes.js";
import DepartmentRoutes from "./src/routes/DepartmentRoutes.js";
import TeamRoutes from "./src/routes/TeamRoutes.js";
import PerformancePeriodRoutes from "./src/routes/PerformancePeriodRoutes.js";
import PerformanceRoutes from "./src/routes/PerformanceRoutes.js";
import CompensationRoutes from "./src/routes/CompensationRoutes.js";
import HRForecastRoutes from "./src/routes/HRForecastRoutes.js";
import HRReportRoutes from "./src/routes/HRReportRoutes.js";
import ProjectRoutes from "./src/routes/ProjectRoutes.js";
import TaskRoutes from "./src/routes/TaskRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT;

app.use(express.json());    // Parse JSON request body

app.use(cors({
    origin: '*', // Cho phép mọi origin truy cập API
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true, 
    optionsSuccessStatus: 200 
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "frame-ancestors": ["'self'", "http://localhost:3000", "http://localhost:3001"], // Allow iframe from frontend
        },
    },
}));

app.use(morgan("dev"));     // Log HTTP requests

// Serve static files từ thư mục uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Test route
app.get("/", (req, res) => {
    res.json({ data: "API is running..." });
});

// Routes using
app.use("/api/user", UserRoutes);
app.use("/api/candidate", CandidateRoutes); 
app.use("/api/employee", EmployeeRoutes);
app.use("/api/job-description", JobDescriptionRoutes);
app.use("/api/training-material", TrainingMaterialRoutes);
app.use("/api/tag", TagRoutes);
app.use("/api/quizzes", QuizzesRoutes);
app.use("/api/quiz-questions", QuizQuestionRoutes);
app.use("/api/question-to-quiz", QuestionToQuizRoutes);
app.use("/api/quiz-results", QuizResultRoutes);
app.use("/api/department", DepartmentRoutes);
app.use("/api/team", TeamRoutes);
app.use("/api/performance-period", PerformancePeriodRoutes);
app.use("/api/performance", PerformanceRoutes);
app.use("/api/compensation", CompensationRoutes);
app.use("/api/hr-forecast", HRForecastRoutes);
app.use("/api/report", HRReportRoutes);
app.use("/api/project", ProjectRoutes);
app.use("/api/task", TaskRoutes);

// Tạo bảng và chạy server
(async () => {
    try {
        // await sequelize.sync();                // tạo bảng nếu chưa có
        // await sequelize.sync({ alter: true }); // tạo bảng nếu chưa có và cập nhật bảng nếu có thay đổi trong model
        // await sequelize.sync({ force: true }); // xóa bảng và tạo lại - dùng khi cần làm mới cơ sở dữ liệu, sẽ bị mất dữ liệu

        app.listen(PORT, () => {
            console.log(`Truy cập local: http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error("Lỗi khởi động server", error);
    }
})();


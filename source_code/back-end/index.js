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

// Import routes here
import UserRoutes from "./src/routes/UserRoutes.js";
import CandidateRoutes from "./src/routes/CandidateRoutes.js";
import EmployeeRoutes from "./src/routes/EmployeeRoutes.js";
import JobDescriptionRoutes from "./src/routes/JobDescriptionRoutes.js";
import TrainingMaterialRoutes from "./src/routes/TrainingMaterialRoutes.js";
import TagRoutes from "./src/routes/TagRoutes.js";

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
    crossOriginResourcePolicy: { policy: "cross-origin" }
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


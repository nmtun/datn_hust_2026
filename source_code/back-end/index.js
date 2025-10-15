import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import sequelize from "./src/config/dbsetup.js"; 

// Import models here
import "./src/models/associations.js"; 
import "./src/models/User.js";
import "./src/models/Candidate.js";
import "./src/models/Employee.js";

// Import routes here
import UserRoutes from "./src/routes/UserRoutes.js";
import CandidateRoutes from "./src/routes/CandidateRoutes.js";
import EmployeeRoutes from "./src/routes/EmployeeRoutes.js";

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

// Test route
app.get("/", (req, res) => {
    res.json({ data: "API is running..." });
});

// Routes using
app.use("/api/users", UserRoutes);
app.use("/api/candidates", CandidateRoutes); 
app.use("/api/employees", EmployeeRoutes);

// Tạo bảng và chạy server
(async () => {
    try {
        // await sequelize.sync();                // tạo bảng nếu chưa có
        // await sequelize.sync({ alter: true }); // tạo bảng nếu chưa có và cập nhật bảng nếu có thay đổi trong model
        // await sequelize.sync({ force: true }); // xóa bảng và tạo lại - dùng khi cần làm mới cơ sở dữ liệu, sẽ bị mất dữ liệu

        // Lắng nghe trên tất cả các interfaces (0.0.0.0) thay vì chỉ localhost
        app.listen(PORT, () => {
            console.log(`Truy cập local: http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error("Lỗi khởi động server", error);
    }
})();


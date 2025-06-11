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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());    // Parse JSON request body
app.use(cors());            // Enable CORS
app.use(helmet());          // Set security HTTP headers
app.use(morgan("dev"));     // Log HTTP requests

// Test route
app.get("/", (req, res) => {
    res.json({ data: "API is running..." });
});

// Routes using
app.use("/api/users", UserRoutes);
app.use("/api/candidates", CandidateRoutes); 

// Tạo bảng và chạy server
(async () => {
    try {
        //await sequelize.sync();                // tạo bảng nếu chưa có
        //await sequelize.sync({ alter: true }); // tạo bảng nếu chưa có và cập nhật bảng nếu có thay đổi trong model
        //await sequelize.sync({ force: true }); // xóa bảng và tạo lại - dùng khi cần làm mới cơ sở dữ liệu, sẽ bị mất dữ liệu

        app.listen(PORT, () => {
            console.log(`Server chạy trên: http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error("Lỗi khởi động server", error);
    }
})();


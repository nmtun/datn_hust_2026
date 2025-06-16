import expess from "express";
import * as userController from "../controllers/UserControllers.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = expess.Router();

router.post("/login", userController.login);

// test route for authentication
router.get("/test-auth", authenticate, (req, res) => {
    res.status(200).json({ message: "Authentication successful", user: req.user });
});

// test route for authorization
router.get("/test-authorize", authenticate, authorize("admin", "Ứng viên"), (req, res) => {
    res.status(200).json({ message: "Authorization successful", user: req.user });
});

export default router;
import expess from "express";
import * as userController from "../controllers/UserControllers.js";

const router = expess.Router();

router.post("/login", userController.login);

export default router;
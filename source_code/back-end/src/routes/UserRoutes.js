import expess from "express";
import * as userController from "../controllers/UserControllers.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = expess.Router();

router.post("/login", userController.login);

// Admin: user management
router.post('/create', authenticate, authorize('admin'), userController.createUser);
router.get('/get-all', authenticate, authorize('admin'), userController.getAllUsers);
router.get('/get/:id', authenticate, authorize('admin'), userController.getUserById);
router.put('/update/:id', authenticate, authorize('admin'), userController.updateUser);
router.delete('/delete/:id', authenticate, authorize('admin'), userController.deleteUser);
router.post('/restore/:id', authenticate, authorize('admin'), userController.restoreUser);
router.get('/profile', authenticate, authorize('admin'), userController.getAdminProfile);
router.put('/profile/update', authenticate, authorize('admin'), userController.updateAdminProfile);

// test route for authentication
router.get("/test-auth", authenticate, (req, res) => {
    res.status(200).json({ message: "Authentication successful", user: req.user });
});

// test route for authorization
router.get("/test-authorize", authenticate, authorize("admin", "Ứng viên"), (req, res) => {
    res.status(200).json({ message: "Authorization successful", user: req.user });
});

export default router;
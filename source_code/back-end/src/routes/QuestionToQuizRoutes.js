import express from "express";
import QuestionToQuizController from "../controllers/QuestionToQuizController.js";
import { authenticate, authorize } from "../middleware/auth.js";
const router = express.Router();

router.post("/add", authenticate, authorize("hr"), QuestionToQuizController.addQuestionToQuiz);
router.post("/auto-add", authenticate, authorize("hr"), QuestionToQuizController.autoAddQuestionsByTags);
router.get("/:quizId/questions", authenticate, authorize("hr"), QuestionToQuizController.getQuestionsByQuiz);
router.get("/:quizId/stats", authenticate, authorize("hr"), QuestionToQuizController.getQuestionStats);
router.get("/question/:questionId/quizzes", authenticate, authorize("hr"), QuestionToQuizController.getQuizzesByQuestion);
router.delete("/remove", authenticate, authorize("hr"), QuestionToQuizController.removeQuestionFromQuiz);
router.put("/reorder", authenticate, authorize("hr"), QuestionToQuizController.reorderQuestions);
router.put("/update", authenticate, authorize("hr"), QuestionToQuizController.updateQuestionToQuiz);

export default router;
import QuestionToQuizService from "../services/QuestionToQuizService.js";
import QuestionToQuiz from "../models/QuesionToQuiz.js";
import Quizzes from "../models/Quizzes.js";
import Tags from "../models/Tag.js";

class QuestionToQuizController {

    /**
     * Thêm câu hỏi vào quiz dựa trên tag
     * POST /api/question-to-quiz/add
     */
    static async addQuestionToQuiz(req, res) {
        try {
            const { questionId, quizId, tagId, questionOrder, pointsOverride } = req.body;
            const addedBy = req.user?.user_id || null;

            if (!questionId || !quizId || !tagId) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin bắt buộc: questionId, quizId, tagId"
                });
            }

            const result = await QuestionToQuizService.addQuestionToQuizByTag(
                questionId, 
                quizId, 
                tagId, 
                { questionOrder, pointsOverride, addedBy }
            );

            return res.status(result.success ? 200 : 400).json(result);

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi server: " + error.message
            });
        }
    }

    /**
     * Lấy danh sách câu hỏi trong quiz theo tag
     * GET /api/question-to-quiz/:quizId/questions?tagId=...
     */
    static async getQuestionsByQuiz(req, res) {
        try {
            const { quizId } = req.params;
            const { tagId } = req.query;

            if (!quizId) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu quizId"
                });
            }

            const result = await QuestionToQuizService.getQuestionsByQuizAndTag(
                parseInt(quizId), 
                tagId ? parseInt(tagId) : null
            );

            return res.status(result.success ? 200 : 400).json(result);

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi server: " + error.message
            });
        }
    }

    /**
     * Tự động thêm câu hỏi vào quiz dựa trên tag
     * POST /api/question-to-quiz/auto-add
     */
    static async autoAddQuestionsByTags(req, res) {
        try {
            const { quizId, tagIds, maxQuestionsPerTag = 10 } = req.body;
            const addedBy = req.user?.user_id || null;

            if (!quizId || !tagIds || !Array.isArray(tagIds)) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin bắt buộc: quizId, tagIds (array)"
                });
            }

            const result = await QuestionToQuizService.autoAddQuestionsByTags(
                quizId, 
                tagIds, 
                { maxQuestionsPerTag, addedBy }
            );

            return res.status(result.success ? 200 : 400).json(result);

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi server: " + error.message
            });
        }
    }

    /**
     * Xóa câu hỏi khỏi quiz
     * DELETE /api/question-to-quiz/remove
     */
    static async removeQuestionFromQuiz(req, res) {
        try {
            const { questionId, quizId } = req.body;

            if (!questionId || !quizId) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin bắt buộc: questionId, quizId"
                });
            }

            const result = await QuestionToQuizService.removeQuestionFromQuiz(
                questionId, 
                quizId
            );

            return res.status(result.success ? 200 : 400).json(result);

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi server: " + error.message
            });
        }
    }

    /**
     * Sắp xếp lại thứ tự câu hỏi trong quiz
     * PUT /api/question-to-quiz/reorder
     */
    static async reorderQuestions(req, res) {
        try {
            const { quizId, questionOrders } = req.body;

            if (!quizId || !questionOrders || !Array.isArray(questionOrders)) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin bắt buộc: quizId, questionOrders (array)"
                });
            }

            const result = await QuestionToQuizService.reorderQuestionsInQuiz(
                quizId, 
                questionOrders
            );

            return res.status(result.success ? 200 : 400).json(result);

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi server: " + error.message
            });
        }
    }

    /**
     * Lấy thống kê câu hỏi theo tag trong quiz
     * GET /api/question-to-quiz/:quizId/stats
     */
    static async getQuestionStats(req, res) {
        try {
            const { quizId } = req.params;

            if (!quizId) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu quizId"
                });
            }

            const result = await QuestionToQuizService.getQuestionStatsByTag(
                parseInt(quizId)
            );

            return res.status(result.success ? 200 : 400).json(result);

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi server: " + error.message
            });
        }
    }

    /**
     * Lấy danh sách quiz mà một câu hỏi đang tham gia
     * GET /api/question-to-quiz/question/:questionId/quizzes
     */
    static async getQuizzesByQuestion(req, res) {
        try {
            const { questionId } = req.params;
            const { tagId } = req.query;

            if (!questionId) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu questionId"
                });
            }

            // Tìm các quiz mà câu hỏi đang tham gia
            const whereClause = {
                question_id: parseInt(questionId),
                is_active: true
            };

            if (tagId) {
                whereClause.tag_id = parseInt(tagId);
            }

            const result = await QuestionToQuiz.findAll({
                where: whereClause,
                include: [
                    {
                        model: Quizzes,
                        as: "quiz"
                    },
                    {
                        model: Tags,
                        as: "tag"
                    }
                ]
            });

            return res.status(200).json({
                success: true,
                data: result,
                message: "Lấy danh sách quiz thành công"
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi server: " + error.message
            });
        }
    }

    /**
     * Cập nhật thông tin liên kết câu hỏi-quiz
     * PUT /api/question-to-quiz/update
     */
    static async updateQuestionToQuiz(req, res) {
        try {
            const { questionId, quizId, questionOrder, pointsOverride, isActive } = req.body;

            if (!questionId || !quizId) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin bắt buộc: questionId, quizId"
                });
            }

            const updateData = {};
            if (questionOrder !== undefined) updateData.question_order = questionOrder;
            if (pointsOverride !== undefined) updateData.points_override = pointsOverride;
            if (isActive !== undefined) updateData.is_active = isActive;

            const [updatedRows] = await QuestionToQuizService.update(
                updateData,
                {
                    where: {
                        question_id: questionId,
                        quiz_id: quizId
                    }
                }
            );

            if (updatedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy liên kết câu hỏi-quiz để cập nhật"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Cập nhật thành công"
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi server: " + error.message
            });
        }
    }
}

export default QuestionToQuizController;
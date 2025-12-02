import QuestionToQuiz from "../models/QuesionToQuiz.js";
import QuizQuestion from "../models/QuizQuestion.js";
import Quizzes from "../models/Quizzes.js";
import Tags from "../models/Tag.js";
import QuestionTags from "../models/QuestionTag.js";
import { Op } from "sequelize";

class QuestionToQuizService {
    
    /**
     * Thêm câu hỏi vào quiz dựa trên tag chung
     * @param {number} questionId - ID câu hỏi
     * @param {number} quizId - ID quiz
     * @param {number} tagId - ID tag liên kết
     * @param {object} options - Tùy chọn bổ sung
     * @returns {Promise<object>} Kết quả thêm câu hỏi
     */
    static async addQuestionToQuizByTag(questionId, quizId, tagId, options = {}) {
        try {
            // Kiểm tra xem câu hỏi có tag này không
            const questionTag = await QuestionTags.findOne({
                where: { question_id: questionId, tag_id: tagId }
            });
            
            if (!questionTag) {
                throw new Error("Câu hỏi không có tag này");
            }

            // Kiểm tra xem câu hỏi đã có trong quiz chưa
            const existing = await QuestionToQuiz.findOne({
                where: { 
                    question_id: questionId, 
                    quiz_id: quizId,
                    is_active: true 
                }
            });
            
            if (existing) {
                throw new Error("Câu hỏi đã có trong quiz này");
            }

            // Lấy thứ tự tiếp theo cho câu hỏi trong quiz
            const maxOrder = await QuestionToQuiz.max('question_order', {
                where: { quiz_id: quizId, is_active: true }
            });
            
            const nextOrder = options.questionOrder || (maxOrder ? maxOrder + 1 : 1);

            const result = await QuestionToQuiz.create({
                question_id: questionId,
                quiz_id: quizId,
                tag_id: tagId,
                question_order: nextOrder,
                points_override: options.pointsOverride || null,
                added_by: options.addedBy || null
            });

            return {
                success: true,
                data: result,
                message: "Thêm câu hỏi vào quiz thành công"
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Lấy tất cả câu hỏi trong quiz theo tag
     * @param {number} quizId - ID quiz
     * @param {number} tagId - ID tag (tùy chọn)
     * @returns {Promise<object>} Danh sách câu hỏi
     */
    static async getQuestionsByQuizAndTag(quizId, tagId = null) {
        try {
            const whereClause = {
                quiz_id: quizId,
                is_active: true
            };

            if (tagId) {
                whereClause.tag_id = tagId;
            }

            const questions = await QuestionToQuiz.findAll({
                where: whereClause,
                include: [
                    {
                        model: QuizQuestion,
                        as: "question",
                        include: [
                            {
                                model: Tags,
                                as: "tags",
                                through: { attributes: [] }
                            }
                        ]
                    },
                    {
                        model: Tags,
                        as: "tag"
                    }
                ],
                order: [['question_order', 'ASC']]
            });

            return {
                success: true,
                data: questions,
                message: "Lấy danh sách câu hỏi thành công"
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Tự động thêm câu hỏi vào quiz dựa trên tag chung
     * @param {number} quizId - ID quiz
     * @param {Array} tagIds - Danh sách ID các tag
     * @param {object} options - Tùy chọn bổ sung
     * @returns {Promise<object>} Kết quả thêm câu hỏi tự động
     */
    static async autoAddQuestionsByTags(quizId, tagIds, options = {}) {
        try {
            const { maxQuestionsPerTag = 10, addedBy = null } = options;
            const addedQuestions = [];
            const errors = [];

            for (const tagId of tagIds) {
                // Tìm các câu hỏi có tag này mà chưa có trong quiz
                const availableQuestions = await QuizQuestion.findAll({
                    include: [
                        {
                            model: QuestionTags,
                            where: { tag_id: tagId },
                            required: true
                        },
                        {
                            model: QuestionToQuiz,
                            as: "quizAssignments",
                            where: { 
                                quiz_id: quizId,
                                is_active: true 
                            },
                            required: false
                        }
                    ],
                    where: {
                        is_active: true,
                        '$quizAssignments.id$': null // Chưa có trong quiz này
                    },
                    limit: maxQuestionsPerTag
                });

                // Thêm từng câu hỏi vào quiz
                for (const question of availableQuestions) {
                    try {
                        const result = await this.addQuestionToQuizByTag(
                            question.question_id, 
                            quizId, 
                            tagId, 
                            { addedBy }
                        );
                        
                        if (result.success) {
                            addedQuestions.push(result.data);
                        } else {
                            errors.push({
                                questionId: question.question_id,
                                error: result.message
                            });
                        }
                    } catch (error) {
                        errors.push({
                            questionId: question.question_id,
                            error: error.message
                        });
                    }
                }
            }

            return {
                success: true,
                data: {
                    addedQuestions,
                    errors,
                    summary: {
                        totalAdded: addedQuestions.length,
                        totalErrors: errors.length
                    }
                },
                message: `Đã thêm ${addedQuestions.length} câu hỏi vào quiz`
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Xóa câu hỏi khỏi quiz (soft delete)
     * @param {number} questionId - ID câu hỏi
     * @param {number} quizId - ID quiz
     * @returns {Promise<object>} Kết quả xóa
     */
    static async removeQuestionFromQuiz(questionId, quizId) {
        try {
            const [updatedRows] = await QuestionToQuiz.update(
                { is_active: false },
                {
                    where: {
                        question_id: questionId,
                        quiz_id: quizId,
                        is_active: true
                    }
                }
            );

            if (updatedRows === 0) {
                throw new Error("Không tìm thấy câu hỏi trong quiz để xóa");
            }

            return {
                success: true,
                message: "Đã xóa câu hỏi khỏi quiz thành công"
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Sắp xếp lại thứ tự câu hỏi trong quiz
     * @param {number} quizId - ID quiz
     * @param {Array} questionOrders - Mảng {questionId, order}
     * @returns {Promise<object>} Kết quả sắp xếp lại
     */
    static async reorderQuestionsInQuiz(quizId, questionOrders) {
        try {
            const updatePromises = questionOrders.map(({ questionId, order }) => {
                return QuestionToQuiz.update(
                    { question_order: order },
                    {
                        where: {
                            question_id: questionId,
                            quiz_id: quizId,
                            is_active: true
                        }
                    }
                );
            });

            await Promise.all(updatePromises);

            return {
                success: true,
                message: "Đã sắp xếp lại thứ tự câu hỏi thành công"
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Lấy thống kê câu hỏi theo tag trong quiz
     * @param {number} quizId - ID quiz
     * @returns {Promise<object>} Thống kê
     */
    static async getQuestionStatsByTag(quizId) {
        try {
            const stats = await QuestionToQuiz.findAll({
                attributes: [
                    'tag_id',
                    [QuestionToQuiz.sequelize.fn('COUNT', QuestionToQuiz.sequelize.col('id')), 'question_count'],
                    [QuestionToQuiz.sequelize.fn('AVG', QuestionToQuiz.sequelize.col('points_override')), 'avg_points']
                ],
                where: {
                    quiz_id: quizId,
                    is_active: true
                },
                include: [
                    {
                        model: Tags,
                        as: "tag",
                        attributes: ['tag_id', 'name']
                    }
                ],
                group: ['tag_id', 'tag.tag_id'],
                raw: false
            });

            return {
                success: true,
                data: stats,
                message: "Lấy thống kê thành công"
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

export default QuestionToQuizService;
import '../models/associations.js';
import QuizResult from "../models/QuizResult.js";
import Quizzes from "../models/Quizzes.js";
import User from "../models/User.js";
import QuizAnswer from "../models/QuizAnswer.js";
import { Op } from 'sequelize';

export const submitQuizResultService = async (resultData, user) => {
    try {
        const {
            quiz_id,
            score,
            pass_status,
            completion_time,
            answers = []
        } = resultData;

        // Validation
        if (!quiz_id) {
            return { status: 400, data: { error: true, message: "Quiz ID is required" } };
        }

        // Verify quiz exists
        const quiz = await Quizzes.findByPk(quiz_id);
        if (!quiz) {
            return { status: 404, data: { error: true, message: "Quiz not found" } };
        }

        // Get the attempt number
        const previousAttempts = await QuizResult.findAll({
            where: {
                user_id: user.user_id,
                quiz_id: quiz_id
            }
        });

        const attemptNumber = previousAttempts.length + 1;

        // Create quiz result
        const newResult = await QuizResult.create({
            user_id: user.user_id,
            quiz_id: quiz_id,
            score: score,
            pass_status: pass_status,
            completion_time: completion_time,
            attempt_number: attemptNumber,
            completion_date: new Date()
        });

        // Save answers if provided
        if (answers.length > 0) {
            const answerRecords = answers.map(answer => ({
                result_id: newResult.result_id,
                question_id: answer.question_id,
                selected_answer: Array.isArray(answer.answer) 
                    ? answer.answer.join(',') 
                    : answer.answer,
                is_correct: answer.is_correct || false
            }));

            await QuizAnswer.bulkCreate(answerRecords);
        }

        // Fetch the complete result with associations
        const result = await QuizResult.findByPk(newResult.result_id, {
            include: [
                {
                    model: Quizzes,
                    as: 'quiz',
                    attributes: ['quiz_id', 'title', 'passing_score']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'full_name', 'personal_email']
                }
            ]
        });

        return {
            status: 201,
            data: {
                error: false,
                message: "Quiz result submitted successfully",
                result: result
            }
        };
    } catch (error) {
        console.error("Error in submitQuizResultService:", error);
        return { status: 500, data: { error: true, message: "Internal server error" } };
    }
};

export const getQuizResultsByUserService = async (userId) => {
    try {
        const results = await QuizResult.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Quizzes,
                    as: 'quiz',
                    attributes: ['quiz_id', 'title', 'description', 'passing_score', 'duration']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                results: results
            }
        };
    } catch (error) {
        console.error("Error in getQuizResultsByUserService:", error);
        return { status: 500, data: { error: true, message: "Internal server error" } };
    }
};

export const getQuizResultByIdService = async (resultId, userId) => {
    try {
        const result = await QuizResult.findOne({
            where: { 
                result_id: resultId,
                user_id: userId 
            },
            include: [
                {
                    model: Quizzes,
                    as: 'quiz',
                    attributes: ['quiz_id', 'title', 'description', 'passing_score', 'duration']
                },
                {
                    model: QuizAnswer,
                    as: 'answers',
                    attributes: ['answer_id', 'question_id', 'selected_answer', 'is_correct']
                }
            ]
        });

        if (!result) {
            return { status: 404, data: { error: true, message: "Quiz result not found" } };
        }

        return {
            status: 200,
            data: {
                error: false,
                result: result
            }
        };
    } catch (error) {
        console.error("Error in getQuizResultByIdService:", error);
        return { status: 500, data: { error: true, message: "Internal server error" } };
    }
};

export const getQuizAttemptHistoryService = async (quizId, userId) => {
    try {
        const attempts = await QuizResult.findAll({
            where: {
                quiz_id: quizId,
                user_id: userId
            },
            include: [
                {
                    model: Quizzes,
                    as: 'quiz',
                    attributes: ['quiz_id', 'title', 'passing_score']
                }
            ],
            order: [['attempt_number', 'DESC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                attempts: attempts,
                total_attempts: attempts.length
            }
        };
    } catch (error) {
        console.error("Error in getQuizAttemptHistoryService:", error);
        return { status: 500, data: { error: true, message: "Internal server error" } };
    }
};

export const getAllQuizResultsService = async (filters = {}) => {
    try {
        const { quiz_id, user_id, pass_status, from_date, to_date } = filters;

        const whereClause = {};
        if (quiz_id) whereClause.quiz_id = quiz_id;
        if (user_id) whereClause.user_id = user_id;
        if (pass_status !== undefined) whereClause.pass_status = pass_status;
        if (from_date || to_date) {
            whereClause.completion_date = {};
            if (from_date) whereClause.completion_date[Op.gte] = from_date;
            if (to_date) whereClause.completion_date[Op.lte] = to_date;
        }

        const results = await QuizResult.findAll({
            where: whereClause,
            include: [
                {
                    model: Quizzes,
                    as: 'quiz',
                    attributes: ['quiz_id', 'title', 'passing_score']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'full_name', 'personal_email', 'company_email']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                results: results,
                total: results.length
            }
        };
    } catch (error) {
        console.error("Error in getAllQuizResultsService:", error);
        return { status: 500, data: { error: true, message: "Internal server error" } };
    }
};

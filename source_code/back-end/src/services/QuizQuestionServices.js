import '../models/associations.js';
import QuizQuestion from "../models/QuizQuestion.js";
import Quizzes from "../models/Quizzes.js";
import { Op } from 'sequelize';

export const createQuestionService = async (questionData, user = null) => {
    try {
        const {
            quiz_id, // Deprecated but kept for backward compatibility  
            question_text,
            question_type,
            options,
            correct_answer,
            points = 1.0
        } = questionData;

        // Validation
        if (!question_text) return { status: 400, data: { error: true, message: "Question text is required" } };
        if (!question_type) return { status: 400, data: { error: true, message: "Question type is required" } };
        if (!correct_answer) return { status: 400, data: { error: true, message: "Correct answer is required" } };

        // Validate question type
        const validTypes = ['multiple_choice', 'multiple_response', 'true_false'];
        if (!validTypes.includes(question_type)) {
            return { status: 400, data: { error: true, message: "Invalid question type" } };
        }

        // Validate options for multiple choice questions
        if ((question_type === 'multiple_choice' || question_type === 'multiple_response') && !options) {
            return { status: 400, data: { error: true, message: "Options are required for multiple choice questions" } };
        }

        // For true/false questions, set standard options
        let processedOptions = options;
        if (question_type === 'true_false') {
            processedOptions = JSON.stringify(['True', 'False']);
        }

        // Create question without quiz_id (questions are now independent)
        const newQuestion = await QuizQuestion.create({
            // quiz_id is removed - questions are now independent and linked via QuestionToQuiz
            question_text,
            question_type,
            options: processedOptions,
            correct_answer,
            points,
            created_by: user?.user_id || null
        });

        return { 
            status: 201, 
            data: {
                error: false,
                message: "Question created successfully",
                question: newQuestion
            }
        };
    } catch (error) {
        return { 
            status: 500, 
            data: {
                error: true,
                message: "An error occurred while creating question",
                details: error.message
            }
        };
    }
};

export const getQuestionsByQuizIdService = async (quizId) => {
    try {
        // Check if quiz exists
        const quiz = await Quizzes.findByPk(quizId);
        if (!quiz) {
            return { status: 404, data: { error: true, message: "Quiz not found" } };
        }

        const questions = await QuizQuestion.findAll({
            where: { quiz_id: quizId },
            include: [
                {
                    model: Quizzes,
                    as: 'quiz',
                    attributes: ['quiz_id', 'title']
                }
            ],
            order: [['question_id', 'ASC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Questions retrieved successfully",
                questions,
                quiz: {
                    quiz_id: quiz.quiz_id,
                    title: quiz.title
                }
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while fetching questions",
                details: error.message
            }
        };
    }
};

export const getAllQuestionsService = async (search = '', questionType = '') => {
    try {
        // Import Tag model
        const { default: Tag } = await import('../models/Tag.js');
        
        const whereClause = {};
        
        if (search) {
            whereClause.question_text = { [Op.like]: `%${search}%` };
        }
        
        if (questionType) {
            whereClause.question_type = questionType;
        }

        const questions = await QuizQuestion.findAll({
            where: whereClause,
            include: [
                {
                    model: Quizzes,
                    as: 'quiz',
                    attributes: ['quiz_id', 'title', 'status']
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['tag_id', 'name'],
                    through: { attributes: [] } // Exclude junction table attributes
                }
            ],
            order: [['question_id', 'DESC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Questions retrieved successfully",
                questions
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while fetching questions",
                details: error.message
            }
        };
    }
};

export const getQuestionByIdService = async (questionId) => {
    try {
        // Import Tag model
        const { default: Tag } = await import('../models/Tag.js');
        
        const question = await QuizQuestion.findByPk(questionId, {
            include: [
                {
                    model: Quizzes,
                    as: 'quiz',
                    attributes: ['quiz_id', 'title', 'status']
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['tag_id', 'name'],
                    through: { attributes: [] } // Exclude junction table attributes
                }
            ]
        });

        if (!question) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Question not found"
                }
            };
        }

        return {
            status: 200,
            data: {
                error: false,
                message: "Question retrieved successfully",
                question
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while fetching question",
                details: error.message
            }
        };
    }
};

export const updateQuestionService = async (questionId, updateData) => {
    try {
        const question = await QuizQuestion.findByPk(questionId);
        
        if (!question) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Question not found"
                }
            };
        }

        // Validate question type if being updated
        if (updateData.question_type) {
            const validTypes = ['multiple_choice', 'multiple_response', 'true_false'];
            if (!validTypes.includes(updateData.question_type)) {
                return { status: 400, data: { error: true, message: "Invalid question type" } };
            }
        }

        // Validate options for multiple choice questions
        if (updateData.question_type && 
            (updateData.question_type === 'multiple_choice' || updateData.question_type === 'multiple_response') && 
            !updateData.options) {
            return { status: 400, data: { error: true, message: "Options are required for multiple choice questions" } };
        }

        // For true/false questions, set standard options
        if (updateData.question_type === 'true_false') {
            updateData.options = JSON.stringify(['True', 'False']);
        }

        await question.update(updateData);

        const updatedQuestion = await QuizQuestion.findByPk(questionId, {
            include: [
                {
                    model: Quizzes,
                    as: 'quiz',
                    attributes: ['quiz_id', 'title']
                }
            ]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Question updated successfully",
                question: updatedQuestion
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while updating question",
                details: error.message
            }
        };
    }
};

export const deleteQuestionService = async (questionId) => {
    try {
        const question = await QuizQuestion.findByPk(questionId);
        
        if (!question) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Question not found"
                }
            };
        }

        await question.destroy();

        return {
            status: 200,
            data: {
                error: false,
                message: "Question deleted successfully"
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while deleting question",
                details: error.message
            }
        };
    }
};

export const deleteQuestionsByQuizIdService = async (quizId) => {
    try {
        // Check if quiz exists
        const quiz = await Quizzes.findByPk(quizId);
        if (!quiz) {
            return { status: 404, data: { error: true, message: "Quiz not found" } };
        }

        const deletedCount = await QuizQuestion.destroy({
            where: { quiz_id: quizId }
        });

        return {
            status: 200,
            data: {
                error: false,
                message: `${deletedCount} questions deleted successfully`
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while deleting questions",
                details: error.message
            }
        };
    }
};

export const bulkCreateQuestionsService = async (questionsData) => {
    try {
        // Validate all questions first
        for (const questionData of questionsData) {
            const { quiz_id, question_text, question_type, correct_answer } = questionData;
            
            if (!quiz_id || !question_text || !question_type || !correct_answer) {
                return { 
                    status: 400, 
                    data: { 
                        error: true, 
                        message: "All fields (quiz_id, question_text, question_type, correct_answer) are required for all questions" 
                    } 
                };
            }

            const validTypes = ['multiple_choice', 'multiple_response', 'true_false'];
            if (!validTypes.includes(question_type)) {
                return { status: 400, data: { error: true, message: `Invalid question type: ${question_type}` } };
            }

            // Check if quiz exists (only check for first unique quiz_id to avoid redundant queries)
            const quiz = await Quizzes.findByPk(quiz_id);
            if (!quiz) {
                return { status: 404, data: { error: true, message: `Quiz with ID ${quiz_id} not found` } };
            }
        }

        // Process questions data
        const processedQuestions = questionsData.map(questionData => {
            let processedOptions = questionData.options;
            if (questionData.question_type === 'true_false') {
                processedOptions = JSON.stringify(['True', 'False']);
            }

            return {
                ...questionData,
                options: processedOptions,
                points: questionData.points || 1.0
            };
        });

        const createdQuestions = await QuizQuestion.bulkCreate(processedQuestions);

        return {
            status: 201,
            data: {
                error: false,
                message: `${createdQuestions.length} questions created successfully`,
                questions: createdQuestions
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while creating questions in bulk",
                details: error.message
            }
        };
    }
};

export const getQuestionsByTagsService = async (tagIds, questionType = '', limit = undefined) => {
    try {
        // Import QuestionTag model
        const { default: QuestionTag } = await import('../models/QuestionTag.js');
        const { default: Tags } = await import('../models/Tag.js');
        
        // Build where condition - only get active questions
        let whereCondition = {
            is_active: true // Only get active questions
        };
        
        if (questionType) {
            whereCondition.question_type = questionType;
        }

        // Get questions that have at least one of the specified tags
        const questions = await QuizQuestion.findAll({
            where: whereCondition,
            include: [{
                model: QuestionTag,
                where: {
                    tag_id: {
                        [Op.in]: tagIds
                    }
                },
                include: [{
                    model: Tags,
                    attributes: ['tag_id', 'name']
                }],
                required: true
            }],
            limit: limit,
            order: [['question_id', 'DESC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Questions retrieved successfully",
                questions: questions
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while fetching questions by tags",
                details: error.message
            }
        };
    }
};
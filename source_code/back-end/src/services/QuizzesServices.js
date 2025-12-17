import '../models/associations.js';
import sequelize from '../config/dbsetup.js';
import Quizzes from "../models/Quizzes.js";
import QuizQuestion from "../models/QuizQuestion.js";
import User from "../models/User.js";
import MaterialQuizzes from "../models/MaterialQuizzes.js";
import TrainingMaterial from "../models/TrainingMaterial.js";
import QuestionTag from "../models/QuestionTag.js";
import QuestionToQuiz from "../models/QuesionToQuiz.js";
import Tags from "../models/Tag.js";
import QuizTags from "../models/QuizTag.js";
import { Op } from 'sequelize';

export const createQuizService = async (quizData, user) => {
    try {
        const {
            title,
            description,
            duration,
            passing_score,
            status = 'active',
            tag_ids = [],
            created_by = user.user_id
        } = quizData;

        // Validation
        if (!title) return { status: 400, data: { error: true, message: "Title is required" } };
        if (!duration || duration <= 0) return { status: 400, data: { error: true, message: "Valid duration is required" } };
        if (!passing_score || passing_score < 0 || passing_score > 100) {
            return { status: 400, data: { error: true, message: "Passing score must be between 0 and 100" } };
        }

        // Validate tags if provided
        if (tag_ids.length > 0) {
            const validTags = await Tags.findAll({
                where: { tag_id: { [Op.in]: tag_ids } }
            });
            if (validTags.length !== tag_ids.length) {
                return { status: 400, data: { error: true, message: "Some tag IDs are invalid" } };
            }
        }

        const newQuiz = await Quizzes.create({
            title,
            description,
            duration,
            passing_score,
            status,
            created_by
        });

        // Add tags to quiz if provided
        if (tag_ids.length > 0) {
            console.log('Adding tags to quiz:', tag_ids);
            try {
                // Create QuizTags records manually
                const quizTagData = tag_ids.map(tagId => ({
                    quiz_id: newQuiz.quiz_id,
                    tag_id: tagId
                }));
                await QuizTags.bulkCreate(quizTagData);
                console.log('Tags added successfully via QuizTags.bulkCreate');
            } catch (tagError) {
                console.error('Error adding tags:', tagError);
                throw tagError;
            }
        }

        // Fetch the created quiz with tags
        const createdQuiz = await Quizzes.findByPk(newQuiz.quiz_id, {
            include: [
                {
                    model: Tags,
                    as: 'tags',
                    attributes: ['tag_id', 'name']
                }
            ]
        });

        return { 
            status: 201, 
            data: {
                error: false,
                message: "Quiz created successfully",
                quiz: createdQuiz
            }
        };
    } catch (error) {
        return { 
            status: 500, 
            data: {
                error: true,
                message: "An error occurred while creating quiz",
                details: error.message
            }
        };
    }
};

export const getAllQuizzesService = async (search = '', status = '') => {
    try {
        const whereClause = {};
        
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }
        
        if (status) {
            whereClause.status = status;
        }

        const quizzes = await Quizzes.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['user_id', 'full_name']
                },
                {
                    model: QuestionToQuiz,
                    as: 'questionAssignments',
                    where: { is_active: true },
                    required: false,
                    include: [
                        {
                            model: QuizQuestion,
                            as: 'question',
                            attributes: ['question_id', 'question_text', 'question_type', 'points']
                        },
                        {
                            model: Tags,
                            as: 'tag',
                            attributes: ['tag_id', 'name']
                        }
                    ]
                },
                {
                    model: Tags,
                    as: 'tags',
                    attributes: ['tag_id', 'name']
                }
            ],
            order: [['creation_date', 'DESC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Quizzes retrieved successfully",
                quizzes
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while fetching quizzes",
                details: error.message
            }
        };
    }
};

export const getQuizByIdService = async (quizId) => {
    try {
        const quiz = await Quizzes.findByPk(quizId, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['user_id', 'full_name']
                },
                {
                    model: QuestionToQuiz,
                    as: 'questionAssignments',
                    where: { is_active: true },
                    required: false,
                    include: [
                        {
                            model: QuizQuestion,
                            as: 'question',
                            attributes: ['question_id', 'question_text', 'question_type', 'options', 'correct_answer', 'points']
                        },
                        {
                            model: Tags,
                            as: 'tag',
                            attributes: ['tag_id', 'name']
                        }
                    ],
                    order: [['question_order', 'ASC']]
                },
                {
                    model: TrainingMaterial,
                    as: 'trainingMaterials',
                    through: { attributes: [] },
                    attributes: ['material_id', 'title']
                },
                {
                    model: Tags,
                    as: 'tags',
                    attributes: ['tag_id', 'name']
                }
            ]
        });

        if (!quiz) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Quiz not found"
                }
            };
        }

        return {
            status: 200,
            data: {
                error: false,
                message: "Quiz retrieved successfully",
                quiz
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while fetching quiz",
                details: error.message
            }
        };
    }
};

export const updateQuizService = async (quizId, updateData) => {
    try {
        const quiz = await Quizzes.findByPk(quizId);
        
        if (!quiz) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Quiz not found"
                }
            };
        }

        // Validation for update data
        if (updateData.duration && updateData.duration <= 0) {
            return { status: 400, data: { error: true, message: "Valid duration is required" } };
        }
        
        if (updateData.passing_score && (updateData.passing_score < 0 || updateData.passing_score > 100)) {
            return { status: 400, data: { error: true, message: "Passing score must be between 0 and 100" } };
        }

        // Extract tag_ids from updateData
        const { tag_ids, ...quizUpdateData } = updateData;

        // Validate tags if provided
        if (tag_ids !== undefined) {
            if (tag_ids.length > 0) {
                const validTags = await Tags.findAll({
                    where: { tag_id: { [Op.in]: tag_ids } }
                });
                if (validTags.length !== tag_ids.length) {
                    return { status: 400, data: { error: true, message: "Some tag IDs are invalid" } };
                }
            }
            
            // Update tags
            await quiz.setTags(tag_ids);
        }

        // Update quiz data
        await quiz.update(quizUpdateData);

        const updatedQuiz = await Quizzes.findByPk(quizId, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['user_id', 'full_name']
                },
                {
                    model: QuestionToQuiz,
                    as: 'questionAssignments',
                    where: { is_active: true },
                    required: false,
                    include: [
                        {
                            model: QuizQuestion,
                            as: 'question',
                            attributes: ['question_id', 'question_text', 'question_type', 'points']
                        },
                        {
                            model: Tags,
                            as: 'tag',
                            attributes: ['tag_id', 'name']
                        }
                    ],
                    order: [['question_order', 'ASC']]
                },
                {
                    model: Tags,
                    as: 'tags',
                    attributes: ['tag_id', 'name']
                }
            ]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Quiz updated successfully",
                quiz: updatedQuiz
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while updating quiz",
                details: error.message
            }
        };
    }
};

export const deleteQuizService = async (quizId) => {
    try {
        const quiz = await Quizzes.findByPk(quizId);
        
        if (!quiz) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Quiz not found"
                }
            };
        }

        // Update status to archived instead of hard delete
        await quiz.update({ status: 'archived' });

        return {
            status: 200,
            data: {
                error: false,
                message: "Quiz archived successfully"
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while archiving quiz",
                details: error.message
            }
        };
    }
};

export const restoreQuizService = async (quizId) => {
    try {
        const quiz = await Quizzes.findByPk(quizId);
        
        if (!quiz) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Quiz not found"
                }
            };
        }

        await quiz.update({ status: 'active' });

        return {
            status: 200,
            data: {
                error: false,
                message: "Quiz restored successfully",
                quiz
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while restoring quiz",
                details: error.message
            }
        };
    }
};

export const getArchivedQuizzesService = async () => {
    try {
        const quizzes = await Quizzes.findAll({
            where: { status: 'archived' },
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['user_id', 'full_name']
                }
            ],
            order: [['creation_date', 'DESC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Archived quizzes retrieved successfully",
                quizzes
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while fetching archived quizzes",
                details: error.message
            }
        };
    }
};

export const attachQuizToMaterialService = async (materialId, quizId) => {
    try {
        // Check if material exists and get its tags
        const material = await TrainingMaterial.findByPk(materialId, {
            include: [
                {
                    model: Tags,
                    as: 'tags',
                    attributes: ['tag_id', 'name']
                }
            ]
        });
        if (!material) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Training material not found"
                }
            };
        }

        // Check if quiz exists and get its tags
        const quiz = await Quizzes.findByPk(quizId, {
            include: [
                {
                    model: Tags,
                    as: 'tags',
                    attributes: ['tag_id', 'name']
                }
            ]
        });
        if (!quiz) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Quiz not found"
                }
            };
        }

        // Check if material and quiz have matching tags
        const materialTagIds = material.tags.map(tag => tag.tag_id);
        const quizTagIds = quiz.tags.map(tag => tag.tag_id);
        
        const hasMatchingTags = materialTagIds.some(tagId => quizTagIds.includes(tagId));
        
        if (!hasMatchingTags && materialTagIds.length > 0 && quizTagIds.length > 0) {
            return {
                status: 400,
                data: {
                    error: true,
                    message: "Quiz and material must have at least one matching tag",
                    material_tags: material.tags.map(tag => tag.name),
                    quiz_tags: quiz.tags.map(tag => tag.name)
                }
            };
        }

        // Check if already attached
        const existing = await MaterialQuizzes.findOne({
            where: { material_id: materialId, quiz_id: quizId }
        });

        if (existing) {
            return {
                status: 400,
                data: {
                    error: true,
                    message: "Quiz is already attached to this material"
                }
            };
        }

        // Create association
        await MaterialQuizzes.create({
            material_id: materialId,
            quiz_id: quizId
        });

        return {
            status: 201,
            data: {
                error: false,
                message: "Quiz attached to material successfully"
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while attaching quiz to material",
                details: error.message
            }
        };
    }
};

export const detachQuizFromMaterialService = async (materialId, quizId) => {
    try {
        const association = await MaterialQuizzes.findOne({
            where: { material_id: materialId, quiz_id: quizId }
        });

        if (!association) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Quiz is not attached to this material"
                }
            };
        }

        await association.destroy();

        return {
            status: 200,
            data: {
                error: false,
                message: "Quiz detached from material successfully"
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while detaching quiz from material",
                details: error.message
            }
        };
    }
};

export const createQuizWithRandomQuestionsService = async (quizData, tagConfigs, user) => {
    try {
        const {
            title,
            description,
            duration,
            passing_score,
            status = 'active',
            created_by = user.user_id
        } = quizData;

        // Validation
        if (!title) return { status: 400, data: { error: true, message: "Title is required" } };
        if (!duration || duration <= 0) return { status: 400, data: { error: true, message: "Valid duration is required" } };
        if (!passing_score || passing_score < 0 || passing_score > 100) {
            return { status: 400, data: { error: true, message: "Passing score must be between 0 and 100" } };
        }
        if (!tagConfigs || tagConfigs.length === 0) {
            return { status: 400, data: { error: true, message: "At least one tag configuration is required" } };
        }

        // Validate tagConfigs structure
        for (const config of tagConfigs) {
            if (!config.tagId || !config.questionCount || config.questionCount <= 0) {
                return { status: 400, data: { error: true, message: "Invalid tag configuration" } };
            }
        }

        // Create
        const newQuiz = await Quizzes.create({
            title,
            description,
            duration,
            passing_score,
            status,
            created_by
        });

        // lấy ds tag
        const tagIds = tagConfigs.map(config => config.tagId);
        if (tagIds.length > 0) {
            console.log('Adding tags to quiz:', tagIds);
            try {
                // quiz-tags records
                const quizTagData = tagIds.map(tagId => ({
                    quiz_id: newQuiz.quiz_id,
                    tag_id: tagId
                }));
                await QuizTags.bulkCreate(quizTagData);
                console.log('Tags added successfully to quiz via QuizTags.bulkCreate');
            } catch (tagError) {
                console.error('Error adding tags to quiz:', tagError);
                throw tagError;
            }
        }

        // Lấy câu hỏi không trùng từ các tag
        const selectedQuestionIds = new Set();  // để tránh trùng lặp
        const selectedQuestions = [];           // lưu câu hỏi đã chọn
        const questionsByTag = {};              // obj lưu câu hỏi theo tag

        // Lấy hết câu hỏi cho mỗi tag
        for (const config of tagConfigs) {
            const tagId = config.tagId;
            const questionsForTag = await sequelize.query(`
                SELECT DISTINCT q.*, qt.tag_id
                FROM Quiz_Questions q
                INNER JOIN Question_Tags qt ON q.question_id = qt.question_id
                WHERE q.is_active = 1 AND qt.tag_id = ${tagId}
                ORDER BY q.question_id DESC
            `, {
                type: sequelize.QueryTypes.SELECT
            });

            // save
            questionsByTag[tagId] = questionsForTag;
            console.log(`Tag ${tagId}: Found ${questionsForTag.length} available questions, need ${config.questionCount}`);
        }

        // chọn câu hỏi cho mỗi tag
        for (const config of tagConfigs) {
            const tagId = config.tagId;
            const questionCount = config.questionCount;
            const availableQuestions = questionsByTag[tagId];

            // lọc ra những câu hỏi chưa được chọn
            const unselectedQuestions = availableQuestions.filter(
                q => !selectedQuestionIds.has(q.question_id)
            );

            console.log(`Tag ${tagId}: ${unselectedQuestions.length} unselected questions available`);

            if (unselectedQuestions.length < questionCount) {
                // lỗi nếu k đủ số lượng
                await Quizzes.destroy({ where: { quiz_id: newQuiz.quiz_id } });
                return { 
                    status: 400, 
                    data: { 
                        error: true, 
                        message: `Not enough unique questions for tag ${tagId}. Found ${unselectedQuestions.length}, need ${questionCount}` 
                    } 
                };
            }

            // random câu hỏi
            const shuffled = unselectedQuestions.sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, questionCount);

            // add vào ds đã chọn
            selected.forEach(question => {
                selectedQuestionIds.add(question.question_id);
                selectedQuestions.push({
                    ...question,
                    assigned_tag_id: tagId // gán tag đã chọn cho câu hỏi
                });
            });
        }

        console.log(`Total selected questions: ${selectedQuestions.length} (unique: ${selectedQuestionIds.size})`);

        // tạo quan hệ
        const questionToQuizData = [];
        for (let i = 0; i < selectedQuestions.length; i++) {
            const question = selectedQuestions[i];
            console.log('Processing question:', question.question_id, 'assigned to tag:', question.assigned_tag_id);
            
            // liên kết quiz và câu hỏi
            questionToQuizData.push({
                question_id: question.question_id,
                quiz_id: newQuiz.quiz_id,
                tag_id: question.assigned_tag_id, // gán tag đã chọn cho câu hỏi
                question_order: i + 1,
                added_by: user.user_id
            });
        }

        console.log('QuestionToQuiz data to create:', questionToQuizData.length, 'records');

        // bulk create
        if (questionToQuizData.length > 0) {
            console.log('Creating QuestionToQuiz records...');
            const createdRecords = await QuestionToQuiz.bulkCreate(questionToQuizData);
            console.log('Created QuestionToQuiz records:', createdRecords.length);
        } else {
            console.log('No QuestionToQuiz data to create!');
        }

        // Get the quiz with questions and tags
        const quizWithQuestions = await Quizzes.findByPk(newQuiz.quiz_id, {
            include: [
                {
                    model: QuestionToQuiz,
                    as: 'questionAssignments',
                    where: { is_active: true },
                    required: false,
                    include: [
                        {
                            model: QuizQuestion,
                            as: 'question'
                        },
                        {
                            model: Tags,
                            as: 'tag'
                        }
                    ],
                    order: [['question_order', 'ASC']]
                },
                {
                    model: Tags,
                    as: 'tags',
                    attributes: ['tag_id', 'name']
                }
            ]
        });

        console.log('Quiz with questions found:', quizWithQuestions?.questionAssignments?.length || 0, 'assignments');

        return { 
            status: 201, 
            data: {
                error: false,
                message: `Quiz created successfully with ${selectedQuestions.length} random questions`,
                quiz: quizWithQuestions,
                selectedQuestions: selectedQuestions.map(q => q.question_id),
                tagBreakdown: tagConfigs.map(config => ({
                    tagId: config.tagId,
                    requested: config.questionCount,
                    selected: selectedQuestions.filter(q => q.assigned_tag_id === config.tagId).length
                }))
            }
        };
    } catch (error) {
        console.error('Error in createQuizWithRandomQuestionsService:', error);
        return { 
            status: 500, 
            data: {
                error: true,
                message: "An error occurred while creating quiz with random questions",
                details: error.message
            }
        };
    }
};

// xóa cứng 
export const hardDeleteQuizService = async (quizId) => {
    try {
        const quiz = await Quizzes.findByPk(quizId);
        if (!quiz) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "Quiz not found"
                }
            };
        }
        await quiz.destroy();
        return {
            status: 200,
            data: {
                error: false,
                message: "Quiz deleted permanently"
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: { 
                error: true,
                message: "An error occurred while deleting quiz permanently",
                details: error.message  
            }
        };
    }   
};

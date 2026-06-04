import '../models/associations.js';
import TrainingMaterial from "../models/TrainingMaterial.js";
import User from "../models/User.js";
import Tag from "../models/Tag.js";
import Quizzes from "../models/Quizzes.js";
import MaterialQuizzes from "../models/MaterialQuizzes.js";
import QuestionToQuiz from "../models/QuesionToQuiz.js";
import { Op } from 'sequelize';
import { requireTenantId, withTenantWhere } from '../utils/tenantScope.js';

export const createTrainingMaterialService = async (materialData, user) => {
    try {
        const {
            title,
            type,
            content_path,
            description,
            status = 'active',
            created_by = user.user_id
        } = materialData;

        const tenantResult = requireTenantId(user);
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant is required" } };
        }

        // Validation
        if (!title) return { status: 400, data: { error: true, message: "Title is required" } };
        if (!type) return { status: 400, data: { error: true, message: "Type is required" } };

        const newMaterial = await TrainingMaterial.create({
            title,
            type,
            content_path,
            description,
            status,
            created_by,
            tenant_id: tenantResult.tenantId
        });

        return { 
            status: 201, 
            data: {
                error: false,
                message: "Training material created successfully",
                newMaterial
            }
        };
    } catch (error) {
        return { 
            status: 500, 
            data: {
                error: true,
                message: "An error occurred while creating training material",
                details: error.message
            }
        };
    }
};

export const getAllTrainingMaterialsService = async (requestingUser = null) => {
    try {
        const materials = await TrainingMaterial.findAll({
            where: withTenantWhere({}, requestingUser),
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'personal_email'],
                    as: 'creator'
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['tag_id', 'name'],
                    through: { attributes: [] }
                },
                {
                    model: Quizzes,
                    as: 'quizzes',
                    attributes: ['quiz_id', 'title', 'description', 'duration', 'passing_score'],
                    through: { attributes: [] }
                }
            ],
            attributes: ['material_id', 'title', 'type', 'content_path', 'description', 'status', 'created_at', 'updated_at'],
            order: [['created_at', 'DESC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Get all training materials successfully",
                materials
            }
        };
    } catch (error) {
        console.error('Error in getAllTrainingMaterialsService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const getTrainingMaterialByIdService = async (materialId, requestingUser = null) => {
    try {
        const material = await TrainingMaterial.findOne({
            where: withTenantWhere({ material_id: materialId }, requestingUser),
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'personal_email'],
                    as: 'creator'
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['tag_id', 'name'],
                    through: { attributes: [] }
                },
                {
                    model: Quizzes,
                    as: 'quizzes',
                    attributes: ['quiz_id', 'title', 'description', 'duration', 'passing_score'],
                    through: { attributes: [] }
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

        return {
            status: 200,
            data: {
                error: false,
                message: "Get training material successfully",
                material
            }
        };
    } catch (error) {
        console.error('Error in getTrainingMaterialByIdService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const updateTrainingMaterialService = async (materialId, updateData, requestingUser = null) => {
    try {
        const material = await TrainingMaterial.findOne({
            where: withTenantWhere({ material_id: materialId }, requestingUser)
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

        const updatedMaterial = await material.update(updateData);

        return {
            status: 200,
            data: {
                error: false,
                message: "Training material updated successfully",
                material: updatedMaterial
            }
        };
    } catch (error) {
        console.error('Error in updateTrainingMaterialService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const deleteTrainingMaterialService = async (materialId, requestingUser = null) => {
    try {
        const material = await TrainingMaterial.findOne({
            where: withTenantWhere({ material_id: materialId }, requestingUser)
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

        await material.update({ status: 'archived' });

        return {
            status: 200,
            data: {
                error: false,
                message: "Training material archived successfully"
            }
        };
    } catch (error) {
        console.error('Error in deleteTrainingMaterialService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const restoreTrainingMaterialService = async (materialId, requestingUser = null) => {
    try {
        const material = await TrainingMaterial.findOne({
            where: withTenantWhere({ material_id: materialId }, requestingUser)
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

        await material.update({ status: 'active' });

        return {
            status: 200,
            data: {
                error: false,
                message: "Training material restored successfully"
            }
        };
    } catch (error) {
        console.error('Error in restoreTrainingMaterialService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const getArchivedTrainingMaterialsService = async (requestingUser = null) => {
    try {
        const materials = await TrainingMaterial.findAll({
            where: withTenantWhere({ status: 'archived' }, requestingUser),
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'personal_email'],
                    as: 'creator'
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['tag_id', 'name'],
                    through: { attributes: [] }
                }
            ],
            attributes: ['material_id', 'title', 'type', 'content_path', 'description', 'status', 'created_at', 'updated_at'],
            order: [['created_at', 'DESC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Get archived training materials successfully",
                materials
            }
        };
    } catch (error) {
        console.error('Error in getArchivedTrainingMaterialsService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const searchTrainingMaterialsService = async (query, requestingUser = null) => {
    try {
        const { title, created_by, status } = query;
        const materialWhere = {};
        const userWhere = {};

        if (title) {
            materialWhere.title = { [Op.like]: `%${title}%` };
        }

        if (created_by) {
            userWhere.full_name = { [Op.like]: `%${created_by}%` };
        }

        if (status) {
            materialWhere.status = status;
        } else {
            materialWhere.status = { [Op.ne]: 'archived' }; // Exclude archived by default
        }

        const materials = await TrainingMaterial.findAll({
            where: withTenantWhere(materialWhere, requestingUser),
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'personal_email'],
                    as: 'creator',
                    where: Object.keys(userWhere).length > 0 ? userWhere : undefined
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['tag_id', 'name'],
                    through: { attributes: [] }
                },
                {
                    model: Quizzes,
                    as: 'quizzes',
                    attributes: ['quiz_id', 'title', 'description', 'duration', 'passing_score'],
                    through: { attributes: [] }
                }
            ],
            attributes: ['material_id', 'title', 'type', 'content_path', 'description', 'status', 'created_at', 'updated_at'],
            order: [['created_at', 'DESC']]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Search training materials successfully",
                materials
            }
        };
    } catch (error) {
        console.error('Error in searchTrainingMaterialsService:', error);
        return {
            status: 500,
            data: {
                error: true,
                message: "Internal server error",
                details: error.message
            }
        };
    }
};

export const attachQuizToMaterialService = async (materialId, quizId, requestingUser = null) => {
    try {
        const tenantResult = requireTenantId(requestingUser);
        if (!tenantResult.ok) {
            return { status: 400, data: { error: true, message: "Tenant is required" } };
        }

        // Check if material exists
        const material = await TrainingMaterial.findOne({
            where: withTenantWhere({ material_id: materialId }, requestingUser)
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

        // Check if quiz exists
        const quiz = await Quizzes.findOne({
            where: withTenantWhere({ quiz_id: quizId }, requestingUser)
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
            quiz_id: quizId,
            tenant_id: tenantResult.tenantId
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

export const detachQuizFromMaterialService = async (materialId, quizId, requestingUser = null) => {
    try {
        const association = await MaterialQuizzes.findOne({
            where: withTenantWhere({ material_id: materialId, quiz_id: quizId }, requestingUser)
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

export const getQuizzesBySharedTagsService = async (materialId, requestingUser = null) => {
    try {
        // Get material with its tags
        const material = await TrainingMaterial.findOne({
            where: withTenantWhere({ material_id: materialId }, requestingUser),
            include: [
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['tag_id', 'name'],
                    through: { attributes: [] }
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

        if (!material.tags || material.tags.length === 0) {
            return {
                status: 200,
                data: {
                    error: false,
                    message: "No shared tag quizzes found",
                    quizzes: []
                }
            };
        }

        // Get tag IDs
        const tagIds = material.tags.map(tag => tag.tag_id);

        // Find quizzes that have questions with shared tags through QuestionToQuiz
        const quizzes = await Quizzes.findAll({
            include: [
                {
                    model: QuestionToQuiz,
                    as: 'questionAssignments',
                    where: {
                        tag_id: { [Op.in]: tagIds },
                        is_active: true
                    },
                    include: [
                        {
                            model: Tag,
                            as: 'tag',
                            attributes: ['tag_id', 'name']
                        }
                    ]
                }
            ],
            where: withTenantWhere({ status: 'active' }, requestingUser),
            attributes: ['quiz_id', 'title', 'description', 'duration', 'passing_score'],
            group: ['Quizzes.quiz_id'],
            distinct: true
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Shared tag quizzes retrieved successfully",
                quizzes,
                materialTags: material.tags
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while fetching shared tag quizzes",
                details: error.message
            }
        };
    }
};
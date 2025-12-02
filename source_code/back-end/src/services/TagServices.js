import '../models/associations.js';
import Tag from "../models/Tag.js";
import MaterialTag from "../models/MaterialTag.js";
import TrainingMaterial from "../models/TrainingMaterial.js";
import { Op } from 'sequelize';

// Create new tag
export const createTagService = async (tagData) => {
    try {
        const { name } = tagData;

        // Validation
        if (!name) {
            return { status: 400, data: { error: true, message: "Tag name is required" } };
        }

        // Check if tag already exists
        const existingTag = await Tag.findOne({ where: { name } });
        if (existingTag) {
            return { status: 409, data: { error: true, message: "Tag already exists" } };
        }

        const newTag = await Tag.create({ name });

        return {
            status: 201,
            data: {
                error: false,
                message: "Tag created successfully",
                tag: newTag
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while creating tag",
                details: error.message
            }
        };
    }
};

// Get all tags
export const getAllTagsService = async () => {
    try {
        const tags = await Tag.findAll({
            order: [['created_at', 'DESC']],
            include: [{
                model: TrainingMaterial,
                as: 'trainingMaterials',
                attributes: ['material_id', 'title'],
                through: { attributes: [] }
            }]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Tags retrieved successfully",
                tags
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while retrieving tags",
                details: error.message
            }
        };
    }
};

// Get tag by ID
export const getTagByIdService = async (tagId) => {
    try {
        const tag = await Tag.findByPk(tagId, {
            include: [{
                model: TrainingMaterial,
                as: 'trainingMaterials',
                attributes: ['material_id', 'title', 'type', 'description'],
                through: { attributes: [] }
            }]
        });

        if (!tag) {
            return { status: 404, data: { error: true, message: "Tag not found" } };
        }

        return {
            status: 200,
            data: {
                error: false,
                message: "Tag retrieved successfully",
                tag
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while retrieving tag",
                details: error.message
            }
        };
    }
};

// Update tag
export const updateTagService = async (tagId, tagData) => {
    try {
        const { name } = tagData;

        const tag = await Tag.findByPk(tagId);
        if (!tag) {
            return { status: 404, data: { error: true, message: "Tag not found" } };
        }

        // Validation
        if (!name) {
            return { status: 400, data: { error: true, message: "Tag name is required" } };
        }

        // Check if another tag with the same name exists
        const existingTag = await Tag.findOne({
            where: {
                name,
                tag_id: { [Op.ne]: tagId }
            }
        });
        if (existingTag) {
            return { status: 409, data: { error: true, message: "Tag name already exists" } };
        }

        await tag.update({
            name,
            updated_at: new Date()
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Tag updated successfully",
                tag
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while updating tag",
                details: error.message
            }
        };
    }
};

// Delete tag
export const deleteTagService = async (tagId) => {
    try {
        const tag = await Tag.findByPk(tagId);
        if (!tag) {
            return { status: 404, data: { error: true, message: "Tag not found" } };
        }

        // Check if tag is being used by any training materials
        const materialTagsCount = await MaterialTag.count({ where: { tag_id: tagId } });
        if (materialTagsCount > 0) {
            return {
                status: 409,
                data: {
                    error: true,
                    message: "Cannot delete tag because it is being used by training materials"
                }
            };
        }

        await tag.destroy();

        return {
            status: 200,
            data: {
                error: false,
                message: "Tag deleted successfully"
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while deleting tag",
                details: error.message
            }
        };
    }
};

// Search tags
export const searchTagsService = async (searchTerm) => {
    try {
        const tags = await Tag.findAll({
            where: {
                name: {
                    [Op.like]: `%${searchTerm}%`
                }
            },
            order: [['name', 'ASC']],
            include: [{
                model: TrainingMaterial,
                as: 'trainingMaterials',
                attributes: ['material_id', 'title'],
                through: { attributes: [] }
            }]
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Tags search completed successfully",
                tags
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while searching tags",
                details: error.message
            }
        };
    }
};

// Assign tags to training material
export const assignTagsToMaterialService = async (materialId, tagIds) => {
    try {
        // Validate if training material exists
        const material = await TrainingMaterial.findByPk(materialId);
        if (!material) {
            return { status: 404, data: { error: true, message: "Training material not found" } };
        }

        // Validate if all tags exist
        const tags = await Tag.findAll({ where: { tag_id: tagIds } });
        if (tags.length !== tagIds.length) {
            return { status: 404, data: { error: true, message: "One or more tags not found" } };
        }

        // Remove existing tags for this material
        await MaterialTag.destroy({ where: { material_id: materialId } });

        // Create new material-tag associations
        const materialTags = tagIds.map(tagId => ({
            material_id: materialId,
            tag_id: tagId
        }));

        await MaterialTag.bulkCreate(materialTags);

        return {
            status: 200,
            data: {
                error: false,
                message: "Tags assigned to material successfully"
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while assigning tags to material",
                details: error.message
            }
        };
    }
};

// Remove tags from training material
export const removeTagsFromMaterialService = async (materialId, tagIds) => {
    try {
        const result = await MaterialTag.destroy({
            where: {
                material_id: materialId,
                tag_id: tagIds
            }
        });

        if (result === 0) {
            return {
                status: 404,
                data: {
                    error: true,
                    message: "No tags found to remove from this material"
                }
            };
        }

        return {
            status: 200,
            data: {
                error: false,
                message: "Tags removed from material successfully"
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while removing tags from material",
                details: error.message
            }
        };
    }
};

// Get materials by tag
export const getMaterialsByTagService = async (tagId) => {
    try {
        const tag = await Tag.findByPk(tagId, {
            include: [{
                model: TrainingMaterial,
                as: 'trainingMaterials',
                through: { attributes: [] }
            }]
        });

        if (!tag) {
            return { status: 404, data: { error: true, message: "Tag not found" } };
        }

        return {
            status: 200,
            data: {
                error: false,
                message: "Materials retrieved successfully",
                tag: tag.name,
                materials: tag.trainingMaterials
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while retrieving materials by tag",
                details: error.message
            }
        };
    }
};

// Assign tags to question
export const assignTagsToQuestionService = async (questionId, tagIds) => {
    try {
        // Import QuestionTag and QuizQuestion models
        const { default: QuestionTag } = await import('../models/QuestionTag.js');
        const { default: QuizQuestion } = await import('../models/QuizQuestion.js');

        // Check if question exists
        const question = await QuizQuestion.findByPk(questionId);
        if (!question) {
            return { status: 404, data: { error: true, message: "Question not found" } };
        }

        // Check if tags exist
        const tags = await Tag.findAll({ where: { tag_id: { [Op.in]: tagIds } } });
        if (tags.length !== tagIds.length) {
            return { status: 404, data: { error: true, message: "One or more tags not found" } };
        }

        // Remove existing tag associations for this question
        await QuestionTag.destroy({ where: { question_id: questionId } });

        // Create new associations
        const associations = tagIds.map(tagId => ({
            question_id: questionId,
            tag_id: tagId
        }));

        await QuestionTag.bulkCreate(associations, { ignoreDuplicates: true });

        return {
            status: 200,
            data: {
                error: false,
                message: "Tags assigned to question successfully",
                assignedTags: tags.length
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while assigning tags to question",
                details: error.message
            }
        };
    }
};

// Remove tags from question
export const removeTagsFromQuestionService = async (questionId, tagIds) => {
    try {
        // Import QuestionTag model
        const { default: QuestionTag } = await import('../models/QuestionTag.js');

        const result = await QuestionTag.destroy({
            where: {
                question_id: questionId,
                tag_id: { [Op.in]: tagIds }
            }
        });

        return {
            status: 200,
            data: {
                error: false,
                message: "Tags removed from question successfully",
                removedCount: result
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while removing tags from question",
                details: error.message
            }
        };
    }
};

// Get questions by tag
export const getQuestionsByTagService = async (tagId) => {
    try {
        // Import QuizQuestion model
        const { default: QuizQuestion } = await import('../models/QuizQuestion.js');
        
        const tag = await Tag.findByPk(tagId, {
            include: [{
                model: QuizQuestion,
                as: 'questions',
                through: { attributes: [] }
            }]
        });

        if (!tag) {
            return { status: 404, data: { error: true, message: "Tag not found" } };
        }

        return {
            status: 200,
            data: {
                error: false,
                message: "Questions retrieved successfully",
                tag: tag.name,
                questions: tag.questions
            }
        };
    } catch (error) {
        return {
            status: 500,
            data: {
                error: true,
                message: "An error occurred while retrieving questions by tag",
                details: error.message
            }
        };
    }
};
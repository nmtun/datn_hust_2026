import * as tagService from "../services/TagServices.js";

// Create new tag
export const createTag = async (req, res) => {
    try {
        const result = await tagService.createTagService(req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Get all tags
export const getAllTags = async (req, res) => {
    try {
        const result = await tagService.getAllTagsService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Get tag by ID
export const getTagById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await tagService.getTagByIdService(id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Update tag
export const updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await tagService.updateTagService(id, req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Delete tag
export const deleteTag = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await tagService.deleteTagService(id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Search tags
export const searchTags = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                error: true,
                message: "Search query parameter 'q' is required"
            });
        }

        const result = await tagService.searchTagsService(q);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Assign tags to training material
export const assignTagsToMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const { tagIds } = req.body;

        if (!tagIds || !Array.isArray(tagIds)) {
            return res.status(400).json({
                error: true,
                message: "tagIds must be an array"
            });
        }

        const result = await tagService.assignTagsToMaterialService(materialId, tagIds);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Remove tags from training material
export const removeTagsFromMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const { tagIds } = req.body;

        if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
            return res.status(400).json({
                error: true,
                message: "tagIds array is required"
            });
        }

        const result = await tagService.removeTagsFromMaterialService(materialId, tagIds);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Get materials by tag
export const getMaterialsByTag = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await tagService.getMaterialsByTagService(id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Assign tags to question
export const assignTagsToQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { tagIds } = req.body;

        if (!tagIds || !Array.isArray(tagIds)) {
            return res.status(400).json({
                error: true,
                message: "tagIds must be an array"
            });
        }

        const result = await tagService.assignTagsToQuestionService(questionId, tagIds);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Remove tags from question
export const removeTagsFromQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { tagIds } = req.body;

        if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
            return res.status(400).json({
                error: true,
                message: "tagIds array is required"
            });
        }

        const result = await tagService.removeTagsFromQuestionService(questionId, tagIds);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Get questions by tag
export const getQuestionsByTag = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await tagService.getQuestionsByTagService(id);
        return res.status(result.status).json(result.data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};
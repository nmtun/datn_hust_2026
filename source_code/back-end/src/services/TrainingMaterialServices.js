import '../models/associations.js';
import TrainingMaterial from "../models/TrainingMaterial.js";
import User from "../models/User.js";
import { Op } from 'sequelize';

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

        // Validation
        if (!title) return { status: 400, data: { error: true, message: "Title is required" } };
        if (!type) return { status: 400, data: { error: true, message: "Type is required" } };

        const newMaterial = await TrainingMaterial.create({
            title,
            type,
            content_path,
            description,
            status,
            created_by
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

export const getAllTrainingMaterialsService = async () => {
    try {
        const materials = await TrainingMaterial.findAll({
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'personal_email'],
                    as: 'creator'
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

export const getTrainingMaterialByIdService = async (materialId) => {
    try {
        const material = await TrainingMaterial.findOne({
            where: { material_id: materialId },
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'personal_email'],
                    as: 'creator'
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

export const updateTrainingMaterialService = async (materialId, updateData) => {
    try {
        const material = await TrainingMaterial.findByPk(materialId);

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

export const deleteTrainingMaterialService = async (materialId) => {
    try {
        const material = await TrainingMaterial.findByPk(materialId);

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

export const restoreTrainingMaterialService = async (materialId) => {
    try {
        const material = await TrainingMaterial.findByPk(materialId);

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

export const getArchivedTrainingMaterialsService = async () => {
    try {
        const materials = await TrainingMaterial.findAll({
            where: { status: 'archived' },
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'personal_email'],
                    as: 'creator'
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

export const searchTrainingMaterialsService = async (query) => {
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
            where: materialWhere,
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'personal_email'],
                    as: 'creator',
                    where: Object.keys(userWhere).length > 0 ? userWhere : undefined
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
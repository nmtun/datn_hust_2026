import * as trainingMaterialService from "../services/TrainingMaterialServices.js";
import fs from 'fs/promises';
import path from 'path';

export const createTrainingMaterial = async (req, res) => {
    try {
        const materialData = {
            ...req.body,
            content_path: undefined
        };

        const result = await trainingMaterialService.createTrainingMaterialService(materialData, req.user);

        if (result.status !== 201) {
            return res.status(result.status).json(result.data);
        }

        // Lưu các file training material
        if (req.files && req.files.length > 0) {
            const uploadsDir = path.join(process.cwd(), 'uploads/training');
            try {
                await fs.mkdir(uploadsDir, { recursive: true });

                const savedFiles = [];
                const title = (req.body.title || 'material').replace(/[^a-zA-Z0-9_.-]/g, '_');
                const now = new Date();
                const timestamp = now.toISOString().slice(0, 19).replace(/[:\-T]/g, '_');

                // Lưu từng file
                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    const ext = path.extname(file.originalname) || '.pdf';
                    const fileName = `${title}_${timestamp}_${i + 1}${ext}`;
                    const filePath = path.join(uploadsDir, fileName);

                    await fs.writeFile(filePath, file.buffer);
                    savedFiles.push(filePath);
                }

                // Lưu thông tin file đầu tiên vào content_path, các file khác có thể lưu vào một field khác
                if (savedFiles.length > 0) {
                    const allFilePaths = savedFiles.join(';'); // Ngăn cách bằng dấu ;
                    await result.data.newMaterial.update({ content_path: allFilePaths });
                    result.data.newMaterial.content_path = allFilePaths;
                }
            } catch (error) {
                console.error('Lỗi lưu file training material:', error);
            }
        }

        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating training material:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllTrainingMaterials = async (req, res) => {
    try {
        const result = await trainingMaterialService.getAllTrainingMaterialsService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching training materials:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getTrainingMaterialById = async (req, res) => {
    try {
        const materialId = req.params.id;
        const result = await trainingMaterialService.getTrainingMaterialByIdService(materialId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching training material by ID:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateTrainingMaterial = async (req, res) => {
    try {
        const materialId = req.params.id;
        const updateData = req.body;

        // Lấy thông tin material hiện tại
        const material = await trainingMaterialService.getTrainingMaterialByIdService(materialId);
        let existingFiles = [];
        if (material.data.material && material.data.material.content_path) {
            existingFiles = material.data.material.content_path.split(';').filter(f => f.trim());
        }

        // Xử lý xóa file cũ nếu có
        let filesToDelete = [];
        if (updateData.filesToDelete) {
            try {
                filesToDelete = JSON.parse(updateData.filesToDelete);
                // Xóa file khỏi hệ thống file
                for (const filePath of filesToDelete) {
                    try {
                        await fs.unlink(filePath);
                        console.log(`Đã xóa file: ${filePath}`);
                    } catch (fileError) {
                        console.warn(`Không thể xóa file: ${filePath}`, fileError.message);
                    }
                }
                // Loại bỏ file đã xóa khỏi danh sách existing files
                existingFiles = existingFiles.filter(file => !filesToDelete.includes(file));
            } catch (parseError) {
                console.error('Lỗi parse filesToDelete:', parseError);
            }
        }

        // Xử lý upload file mới nếu có
        let newFiles = [];
        if (req.files && req.files.length > 0) {
            const uploadsDir = path.join(process.cwd(), 'uploads/training');
            try {
                await fs.mkdir(uploadsDir, { recursive: true });

                const title = (updateData.title || 'material').replace(/[^a-zA-Z0-9_.-]/g, '_');
                const now = new Date();
                const timestamp = now.toISOString().slice(0, 19).replace(/[:\-T]/g, '_');

                // Lưu từng file mới
                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    const ext = path.extname(file.originalname) || '.pdf';
                    const fileName = `${title}_${timestamp}_${i + 1}${ext}`;
                    const filePath = path.join(uploadsDir, fileName);

                    await fs.writeFile(filePath, file.buffer);
                    newFiles.push(filePath);
                }
            } catch (error) {
                console.error('Lỗi lưu file training material mới:', error);
            }
        }

        // Cập nhật content_path với file còn lại + file mới
        const allFiles = [...existingFiles, ...newFiles];
        updateData.content_path = allFiles.join(';');

        // Xóa filesToDelete khỏi updateData trước khi gửi đến service
        delete updateData.filesToDelete;

        const result = await trainingMaterialService.updateTrainingMaterialService(materialId, updateData);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating training material:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const deleteTrainingMaterial = async (req, res) => {
    try {
        const materialId = req.params.id;
        const result = await trainingMaterialService.deleteTrainingMaterialService(materialId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error deleting training material:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const restoreTrainingMaterial = async (req, res) => {
    try {
        const materialId = req.params.id;
        const result = await trainingMaterialService.restoreTrainingMaterialService(materialId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error restoring training material:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getArchivedTrainingMaterials = async (req, res) => {
    try {
        const result = await trainingMaterialService.getArchivedTrainingMaterialsService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching archived training materials:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const searchTrainingMaterials = async (req, res) => {
    try {
        const query = req.query;
        const result = await trainingMaterialService.searchTrainingMaterialsService(query);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error searching training materials:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const attachQuizToMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const { quizId } = req.body;
        
        if (!materialId || !quizId) {
            return res.status(400).json({
                error: true,
                message: "Material ID and Quiz ID are required"
            });
        }

        const result = await trainingMaterialService.attachQuizToMaterialService(materialId, quizId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error attaching quiz to material:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const detachQuizFromMaterial = async (req, res) => {
    try {
        const { materialId, quizId } = req.params;
        const result = await trainingMaterialService.detachQuizFromMaterialService(materialId, quizId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error detaching quiz from material:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getQuizzesBySharedTags = async (req, res) => {
    try {
        const { materialId } = req.params;
        const result = await trainingMaterialService.getQuizzesBySharedTagsService(materialId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching quizzes by shared tags:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
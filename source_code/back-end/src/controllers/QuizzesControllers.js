import * as quizzesService from "../services/QuizzesServices.js";

export const createQuiz = async (req, res) => {
    try {
        const quizData = req.body;
        const result = await quizzesService.createQuizService(quizData, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating quiz:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllQuizzes = async (req, res) => {
    try {
        const { search = '', status = '' } = req.query;
        const result = await quizzesService.getAllQuizzesService(search, status);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching quizzes:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getQuizById = async (req, res) => {
    try {
        const quizId = req.params.id;
        const result = await quizzesService.getQuizByIdService(quizId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching quiz by ID:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const updateData = req.body;
        const result = await quizzesService.updateQuizService(quizId, updateData);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating quiz:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const deleteQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const result = await quizzesService.deleteQuizService(quizId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error deleting quiz:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const restoreQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const result = await quizzesService.restoreQuizService(quizId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error restoring quiz:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getArchivedQuizzes = async (req, res) => {
    try {
        const result = await quizzesService.getArchivedQuizzesService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching archived quizzes:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const attachQuizToMaterial = async (req, res) => {
    try {
        const { materialId, quizId } = req.body;
        
        if (!materialId || !quizId) {
            return res.status(400).json({
                error: true,
                message: "Material ID and Quiz ID are required"
            });
        }

        const result = await quizzesService.attachQuizToMaterialService(materialId, quizId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error attaching quiz to material:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const detachQuizFromMaterial = async (req, res) => {
    try {
        const { materialId, quizId } = req.params;
        const result = await quizzesService.detachQuizFromMaterialService(materialId, quizId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error detaching quiz from material:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const createQuizWithRandomQuestions = async (req, res) => {
    try {
        const { quizData, tagConfigs } = req.body;
        
        if (!quizData || !tagConfigs) {
            return res.status(400).json({
                error: true,
                message: "Quiz data and tag configurations are required"
            });
        }

        if (!Array.isArray(tagConfigs) || tagConfigs.length === 0) {
            return res.status(400).json({
                error: true,
                message: "At least one tag configuration is required"
            });
        }

        // Validate each tag configuration
        for (const config of tagConfigs) {
            if (!config.tagId || !config.questionCount || config.questionCount <= 0) {
                return res.status(400).json({
                    error: true,
                    message: "Each tag configuration must have a valid tagId and questionCount greater than 0"
                });
            }
        }

        const result = await quizzesService.createQuizWithRandomQuestionsService(quizData, tagConfigs, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating quiz with random questions:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const hardDeleteQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const result = await quizzesService.hardDeleteQuizService(quizId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error hard deleting quiz:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

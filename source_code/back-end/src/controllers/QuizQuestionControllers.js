import * as questionService from "../services/QuizQuestionServices.js";

export const createQuestion = async (req, res) => {
    try {
        const questionData = req.body;
        const result = await questionService.createQuestionService(questionData, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error creating question:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getQuestionsByQuizId = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const result = await questionService.getQuestionsByQuizIdService(quizId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching questions by quiz ID:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllQuestions = async (req, res) => {
    try {
        const { search = '', questionType = '' } = req.query;
        const result = await questionService.getAllQuestionsService(search, questionType);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching all questions:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getQuestionById = async (req, res) => {
    try {
        const questionId = req.params.id;
        const result = await questionService.getQuestionByIdService(questionId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching question by ID:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;
        const updateData = req.body;
        const result = await questionService.updateQuestionService(questionId, updateData);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error updating question:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;
        const result = await questionService.deleteQuestionService(questionId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error deleting question:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const deleteQuestionsByQuizId = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const result = await questionService.deleteQuestionsByQuizIdService(quizId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error deleting questions by quiz ID:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const bulkCreateQuestions = async (req, res) => {
    try {
        const questionsData = req.body.questions; // Expecting { questions: [...] }
        
        if (!questionsData || !Array.isArray(questionsData)) {
            return res.status(400).json({
                error: true,
                message: "Questions array is required"
            });
        }

        const result = await questionService.bulkCreateQuestionsService(questionsData);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error bulk creating questions:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getQuestionsByTags = async (req, res) => {
    try {
        const { tagIds, questionType = '', limit } = req.query;
        
        if (!tagIds) {
            return res.status(400).json({
                error: true,
                message: "Tag IDs are required"
            });
        }

        // Parse tagIds from comma-separated string to array
        const tagIdsArray = tagIds.split(',').map(id => parseInt(id.trim()));
        const result = await questionService.getQuestionsByTagsService(tagIdsArray, questionType, limit ? parseInt(limit) : undefined);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching questions by tags:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};
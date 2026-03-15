import * as quizResultService from "../services/QuizResultServices.js";

export const submitQuizResult = async (req, res) => {
    try {
        const resultData = req.body;
        const result = await quizResultService.submitQuizResultService(resultData, req.user);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error submitting quiz result:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getQuizResultsByUser = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await quizResultService.getQuizResultsByUserService(userId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching quiz results:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getQuizResultById = async (req, res) => {
    try {
        const resultId = req.params.id;
        const userId = req.user.user_id;
        const result = await quizResultService.getQuizResultByIdService(resultId, userId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching quiz result by ID:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getQuizAttemptHistory = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const userId = req.user.user_id;
        const result = await quizResultService.getQuizAttemptHistoryService(quizId, userId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching quiz attempt history:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getAllQuizResults = async (req, res) => {
    try {
        const { quiz_id, user_id, pass_status, from_date, to_date } = req.query;
        const filters = {
            quiz_id,
            user_id,
            pass_status: pass_status === 'true' ? true : pass_status === 'false' ? false : undefined,
            from_date,
            to_date
        };
        const result = await quizResultService.getAllQuizResultsService(filters);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching all quiz results:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

import * as reportService from '../services/HRReportServices.js';

export const getEmployeeCountReport = async (req, res) => {
    try {
        const result = await reportService.getEmployeeCountReportService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting employee count report:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getEmployeesByDepartment = async (req, res) => {
    try {
        const result = await reportService.getEmployeesByDepartmentService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting employees by department:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getTurnoverReport = async (req, res) => {
    try {
        const result = await reportService.getTurnoverReportService(req.query);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting turnover report:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

export const getPerformanceSummary = async (req, res) => {
    try {
        const result = await reportService.getPerformanceSummaryService();
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error getting performance summary:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

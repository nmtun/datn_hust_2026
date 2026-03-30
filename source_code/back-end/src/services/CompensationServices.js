import '../models/associations.js';
import Compensation from '../models/Compensation.js';
import User from '../models/User.js';

const userAttrs = ['user_id', 'full_name', 'company_email'];

export const createCompensationService = async (data, approverId) => {
    try {
        const { user_id, salary, bonus, effective_date, reason } = data;
        if (!user_id || !salary || !effective_date) {
            return { status: 400, data: { error: true, message: "user_id, salary and effective_date are required" } };
        }
        const comp = await Compensation.create({
            user_id, salary, bonus: bonus || 0, effective_date, reason,
            approved_by: approverId, approved_at: new Date(), created_at: new Date()
        });
        return { status: 201, data: { error: false, message: "Compensation record created successfully", compensation: comp } };
    } catch (error) {
        console.error('Error in createCompensationService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getAllCompensationService = async () => {
    try {
        const records = await Compensation.findAll({
            include: [
                { model: User, as: 'employee', attributes: userAttrs },
                { model: User, as: 'approver', attributes: userAttrs }
            ],
            order: [['effective_date', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "All compensation records retrieved", records } };
    } catch (error) {
        console.error('Error in getAllCompensationService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getCompensationByEmployeeService = async (userId) => {
    try {
        const records = await Compensation.findAll({
            where: { user_id: userId },
            include: [{ model: User, as: 'approver', attributes: userAttrs }],
            order: [['effective_date', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "Employee compensation history retrieved", records } };
    } catch (error) {
        console.error('Error in getCompensationByEmployeeService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const updateCompensationService = async (id, data) => {
    try {
        const comp = await Compensation.findByPk(id);
        if (!comp) return { status: 404, data: { error: true, message: "Compensation record not found" } };

        const allowed = ['salary', 'bonus', 'effective_date', 'reason'];
        const updateData = {};
        Object.keys(data).forEach(key => { if (allowed.includes(key)) updateData[key] = data[key]; });
        updateData.updated_at = new Date();

        await comp.update(updateData);
        return { status: 200, data: { error: false, message: "Compensation updated successfully" } };
    } catch (error) {
        console.error('Error in updateCompensationService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

export const getMyCompensationService = async (userId) => {
    try {
        const records = await Compensation.findAll({
            where: { user_id: userId },
            include: [{ model: User, as: 'approver', attributes: userAttrs }],
            order: [['effective_date', 'DESC']]
        });
        return { status: 200, data: { error: false, message: "My compensation history retrieved", records } };
    } catch (error) {
        console.error('Error in getMyCompensationService:', error);
        return { status: 500, data: { error: true, message: "Internal server error", details: error.message } };
    }
};

import User from "../models/User.js";
import { Op } from "sequelize";

// Create user service
export const createUserService = async (userData) => {
    return await User.create(userData);
};  

export const findUserByEmailService = async (email) => {
    if (!email) return null;
    return await User.findOne({
        where: {
            [Op.or]: [
                { personal_email: email },
                { company_email: email }
            ]
        }
    });
};
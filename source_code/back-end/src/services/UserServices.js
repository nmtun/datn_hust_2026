import User from "../models/User.js";

// Create user service
export const createUser = async (userData) => {
    return await User.create(userData);
};  

export const findUserByEmail = async (email) => {
    return await User.findOne({ where: { personal_email: email } });
}
import Candidate from '../models/Candidate.js';

// Create candidate service
export const createCandidate = async (candidateData) => {
    return await Candidate.create(candidateData);
};
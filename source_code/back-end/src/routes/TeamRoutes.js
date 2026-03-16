import express from 'express';
import * as teamController from '../controllers/TeamControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr", "manager"), teamController.createTeam);
router.get('/get-all', authenticate, authorize("hr", "manager", "employee"), teamController.getAllTeams);
router.get('/get/:id', authenticate, authorize("hr", "manager", "employee"), teamController.getTeamById);
router.put('/update/:id', authenticate, authorize("hr", "manager"), teamController.updateTeam);
router.delete('/delete/:id', authenticate, authorize("hr", "manager"), teamController.deleteTeam);

router.put('/:id/add-member', authenticate, authorize("hr", "manager"), teamController.addMember);
router.put('/:id/remove-member', authenticate, authorize("hr", "manager"), teamController.removeMember);

export default router;

import express from 'express';
import * as teamController from '../controllers/TeamControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr", "manager", "tenant_admin"), teamController.createTeam);
router.get('/get-all', authenticate, authorize("hr", "manager", "employee", "tenant_admin"), teamController.getAllTeams);
router.get('/managed', authenticate, authorize("hr", "manager", "employee", "tenant_admin"), teamController.getManagedTeams);
router.get('/get/:id', authenticate, authorize("hr", "manager", "employee", "tenant_admin"), teamController.getTeamById);
router.put('/update/:id', authenticate, authorize("hr", "manager", "tenant_admin"), teamController.updateTeam);
router.delete('/delete/:id', authenticate, authorize("hr", "manager", "tenant_admin"), teamController.deleteTeam);

router.put('/:id/add-member', authenticate, authorize("hr", "manager", "employee", "tenant_admin"), teamController.addMember);
router.put('/:id/remove-member', authenticate, authorize("hr", "manager", "employee", "tenant_admin"), teamController.removeMember);

export default router;

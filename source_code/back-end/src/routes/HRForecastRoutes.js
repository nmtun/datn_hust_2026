import express from 'express';
import * as forecastController from '../controllers/HRForecastControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, authorize("hr"), forecastController.createForecast);
router.get('/get-all', authenticate, authorize("hr"), forecastController.getAllForecasts);
router.get('/get/:id', authenticate, authorize("hr"), forecastController.getForecastById);
router.put('/update/:id', authenticate, authorize("hr"), forecastController.updateForecast);

export default router;

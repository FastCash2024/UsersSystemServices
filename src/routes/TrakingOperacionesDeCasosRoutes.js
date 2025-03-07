import express from 'express';
import { createTrackings, getTrackings, updateTrackingById } from '../controllers/TrakingOperacionesDeCasos.js';

const router = express.Router();

router.get('/', getTrackings);
router.post('/add', createTrackings);
router.put('/update', updateTrackingById);

export default router;

import express from 'express';
import { getEntryTimeForToday, registerEntryTime } from '../controllers/HourEntryController.js';

const router = express.Router();

router.put('/register', registerEntryTime);

router.get('/gethour', getEntryTimeForToday);

export default router;
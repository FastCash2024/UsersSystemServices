import express from 'express';
import { createComisionVerification, deleteComisionVerificationById, getAllComisionVerification, getComisionVerification, updateComisionVerificationById } from '../controllers/comisionVerificationController.js';

const router = express.Router();


router.post('/', createComisionVerification);
router.get('/', getAllComisionVerification);
router.get('/:id', getComisionVerification);
router.put('/:id', updateComisionVerificationById);
router.delete('/:id', deleteComisionVerificationById);

export default router;
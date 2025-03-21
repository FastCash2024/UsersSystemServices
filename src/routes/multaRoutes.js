import express from 'express';
import { addMulta, deleteMulta, editMulta, getAllMultas, getMultaById, getReporteDiarioMultas, getReporteDiarioTotalesMultas } from "../controllers/multaController.js";

const router = express.Router();

router.post('/multas', addMulta);
router.put('/multas/:id', editMulta);
router.delete('/multas/:id', deleteMulta);
router.get('/multas', getAllMultas);
router.get('/multas/:id', getMultaById);
router.get('/reporte', getReporteDiarioMultas);
router.get('/reporteTotales', getReporteDiarioTotalesMultas);

export default router;
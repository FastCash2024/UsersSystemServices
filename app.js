import express from 'express'; 
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import TrakingOperacionesDeCasosRoutes from './src/routes/TrakingOperacionesDeCasosRoutes.js';
import multaRoutes from './src/routes/multaRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import comisionRoutes from './src/routes/comisionRoutes.js';
import applicationsRoutes from './src/routes/applicationsRoutes.js';
import hourEntryRoutes from './src/routes/horEntryRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import bodyParser from  'body-parser';
import path from 'path';
import { fileURLToPath } from 'url'; // Asegúrate de importar fileURLToPath

dotenv.config();
const app = express();
app.use(bodyParser.json());

app.use(cors());

// Conectar a MongoDB
connectDB();

app.use(express.json({ limit: '100mb' })); // Ajusta el límite según el tamaño de las solicitudes esperadas
app.use(express.urlencoded({ limit: '100mb', extended: true }));
// Rutas
app.use('/api/users/trakingoperaciones', TrakingOperacionesDeCasosRoutes);  // KardexDB ---> comision
app.use('/api/users/comision', comisionRoutes); // KardexDB ---> comision
app.use('/api/users/multas', multaRoutes); // KardexDB ---> comision
app.use('/api/users/attendance', attendanceRoutes); // KardexDB ---> Asistencia
app.use('/api/users/applications', applicationsRoutes);// KardexDB ---> comision
app.use('/api/users/entryhour', hourEntryRoutes);

// const __dirname = path.dirname(new URL(import.meta.url).pathname);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use('/public', express.static(path.join(__dirname, 'public')));

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

                  








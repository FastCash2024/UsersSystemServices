import express from 'express'; 
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import TrakingOperacionesDeCasosRoutes from './src/routes/TrakingOperacionesDeCasosRoutes.js';
import multaRoutes from './src/routes/multaRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import comisionRoutes from './src/routes/comisionRoutes.js';

import { errorHandler } from './src/middleware/errorHandler.js';

import bodyParser from  'body-parser';
import twilio from 'twilio';
import path from 'path';
import { fileURLToPath } from 'url'; // Asegúrate de importar fileURLToPath

dotenv.config();
const app = express();
app.use(bodyParser.json());

app.use(cors());
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Conectar a MongoDB
connectDB();

app.use(express.json({ limit: '100mb' })); // Ajusta el límite según el tamaño de las solicitudes esperadas
app.use(express.urlencoded({ limit: '100mb', extended: true }));
// Rutas
app.use('/api/trakingoperaciones', TrakingOperacionesDeCasosRoutes);  // KardexDB ---> comision
app.use('/api/comision', comisionRoutes); // KardexDB ---> comision
app.use('/api/multas', multaRoutes); // KardexDB ---> comision
app.use('/api/attendance', attendanceRoutes); // KardexDB ---> Asistencia

// const __dirname = path.dirname(new URL(import.meta.url).pathname);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use('/public', express.static(path.join(__dirname, 'public')));

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

                  








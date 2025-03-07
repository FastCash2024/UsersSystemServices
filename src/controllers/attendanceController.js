import { AttendanceModel } from "../models/AttendanceModel.js";
import User from '../models/AuthCollection.js';
import UserSchema from '../models/AuthPersonalAccountCollection.js';
import { getCurrentWeekRange, getWeekNumber, getWeekRange } from "../utilities/currentWeek.js";

const getUserAttendance = async (userId, start, end) => {
    try {
        const attendances = await AttendanceModel.find({
            user: userId,
            fecha: {
                $gte: start,
                $lte: end,
            },
        }).lean();

        const attendanceMap = {};
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const formattedDate = d.toISOString().split('T')[0];
            const attendanceRecord = attendances.find(
                (att) => att.fecha.toISOString().split('T')[0] === formattedDate
            );
            attendanceMap[formattedDate] = attendanceRecord
                ? attendanceRecord.EstadoDeAsistencia
                : "";
        }

        return attendanceMap;
    } catch (error) {
        console.error("Error al obtener la asistencia del usuario:", error);
        throw error;
    }
};

export const getUsersAttendance = async (req, res) => {
    try {
        const { startDate, endDate, usuario, tipoDeGrupo } = req.query;
      
        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            const currentWeekRange = getCurrentWeekRange();
            start = currentWeekRange.start;
            end = currentWeekRange.end;
        }

        if (!start || !end) {
            throw new Error("Las fechas de inicio y fin no están definidas");
        }

        const userFilter = {};
        if (usuario) {
            userFilter.cuenta = { $regex: usuario, $options: "i" };
        }

        if (tipoDeGrupo) {
            userFilter.tipoDeGrupo = { $regex: tipoDeGrupo, $options: "i" }; // Insensible a mayúsculas
        }

        const users = await User.find(userFilter).lean();

        const result = await Promise.all(
            users.map(async (user) => ({
                id: user._id,
                usuario: user.cuenta,
                tipoDeGrupo: user.tipoDeGrupo,
                asistencias: await getUserAttendance(user._id, start, end),
            }))
        );

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({
            error: "Error al obtener los usuarios",
            details: error.message
        });
    }
};

export const getUsersAttendanceById = async (req, res) => {
    try {
        const { user } = req.params;
        const { page = 1, limit = 52
            
         } = req.query;

        const limitInt = parseInt(limit, 10);
        const pageInt = parseInt(page, 10);       
        
        const userRecord = await User.find({ cuenta: user }).lean();
        
        if (!userRecord) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const attendances = await AttendanceModel.find({ user }).lean();

        const attendanceMap = {};
        attendances.forEach((attendance) => {
            const weekNumber = getWeekNumber(new Date(attendance.fecha));
            if (!attendanceMap[weekNumber]) {
                attendanceMap[weekNumber] = {};
            }
            const formattedDate = new Date(attendance.fecha).toISOString().split('T')[0];
            attendanceMap[weekNumber][formattedDate] = attendance.EstadoDeAsistencia;
        });

        // Completar semanas sin registros con "Libre"
        const currentYear = new Date().getFullYear();
        const totalWeeksInYear = getWeekNumber(new Date(currentYear, 11, 31));
        for (let week = 1; week <= totalWeeksInYear; week++) {
            const { start, end } = getWeekRange(currentYear, week);
            if (!attendanceMap[week]) {
                attendanceMap[week] = {};
            }
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const formattedDate = d.toISOString().split('T')[0];
                if (!attendanceMap[week][formattedDate]) {
                    attendanceMap[week][formattedDate] = "Libre";
                }
            }
        }

        // Ordenar las fechas dentro de cada semana
        Object.keys(attendanceMap).forEach(week => {
            attendanceMap[week] = Object.keys(attendanceMap[week])
                .sort((a, b) => new Date(a) - new Date(b))
                .reduce((acc, date) => {
                    acc[date] = attendanceMap[week][date];
                    return acc;
                }, {});
        });

        const totalWeeks = Object.keys(attendanceMap).length;
        const totalPages = Math.ceil(totalWeeks / limitInt);

        const paginatedWeeks = Object.keys(attendanceMap)
            .sort((a, b) => a - b)
            .slice((pageInt - 1) * limitInt, pageInt * limitInt)
            .map(week => {
                const { start, end } = getWeekRange(currentYear, week);
                return {
                    semana: `Semana ${week}`,
                    startWeek: start.toISOString().split('T')[0],
                    endWeek: end.toISOString().split('T')[0],
                    asistencias: attendanceMap[week]
                };
            });

        res.json({
            usuario: userRecord.cuenta,
            tipoDeGrupo: userRecord.tipoDeGrupo,
            data: paginatedWeeks,
            currentPage: pageInt,
            totalPages,
            totalWeeks,
        });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las asistencias del usuario.".error.message });
    }
};

export const registerAttendance = async (req, res) => {
    try {
        const { userId } = req.body;

        let user = await User.findById(userId);
        if (!user) {
            user = await UserSchema.findById(userId);
            if(!user){
                return res.status(404).json({
                    error: "Usuario no encontrado",
                });
            }
        }

        const fechaHoy = new Date();
        const inicioDelDia = new Date(fechaHoy.setHours(0, 0, 0, 0));
        const finDelDia = new Date(fechaHoy.setHours(23, 59, 59, 999));

        const asistenciaExistente = await AttendanceModel.findOne({
            user: userId,
            fecha: {
                $gte: inicioDelDia,
                $lte: finDelDia,
            },
        });

        if (asistenciaExistente) {
            return res.status(200).json({
                message: "Ya has marcado tu asistencia hoy",
            });
        }

        const horaActual = new Date();
        const horaEntrada = `${horaActual.getHours()}:${horaActual.getMinutes()}`;
        const horaSalida = '18:00'

        const horaLimite2 = new Date(fechaHoy);
        horaLimite2.setHours(8, 15, 0, 0); // 8:15 AM

        const horaLimite3 = new Date(fechaHoy);
        horaLimite3.setHours(8, 25, 0, 0); // 8:25 AM

        const horaLimite4 = new Date(fechaHoy);
        horaLimite4.setHours(8, 30, 0, 0); // 8:30 AM

        let estadoDeAsistencia;

        if (horaActual < horaLimite2) {
            estadoDeAsistencia = 'Operando';
        } else if (horaActual >= horaLimite2 && horaActual < horaLimite3) {
            estadoDeAsistencia = 'Atraso-1';
        } else if (horaActual >= horaLimite3 && horaActual <= horaLimite4) {
            estadoDeAsistencia = 'Atraso-2';
        } else if (horaActual > horaLimite4) {
            estadoDeAsistencia = 'Falta';
        }

        const newAttendance = new AttendanceModel({
            user: userId,
            fecha: new Date(),
            horaEntrada,
            horaSalida,
            EstadoDeAsistencia: estadoDeAsistencia,
            observaciones: ''
        });

        await newAttendance.save();

        res.status(201).json({
            message: 'Asistencia registrada',
            asistencia: newAttendance,
        });

    } catch (error) {
        res.status(500).json({
            error: "Error al registrar la asistencia",
            details: error.message,
        });
    }
}

export const updateAttendance = async (req, res) => {
    try {
        const { userId, fecha, EstadoDeAsistencia, observaciones } = req.body;

        const fechaInicio = new Date(fecha);
        fechaInicio.setUTCHours(0, 0, 0, 0);

        const fechaFin = new Date(fecha);
        fechaFin.setUTCHours(23, 59, 59, 999);

        const asistenciaExistente = await AttendanceModel.findOne({
            user: userId,
            fecha: {
                $gte: fechaInicio,
                $lte: fechaFin,
            },
        });

        if (!asistenciaExistente) {
            return res.status(404).json({
                error: "Asistencia no encontrada para el usuario en esta fecha",
            });
        }

        asistenciaExistente.EstadoDeAsistencia = EstadoDeAsistencia;
        asistenciaExistente.observaciones = observaciones;

        await asistenciaExistente.save();

        res.status(200).json({
            message: "Asistencia actualizada correctamente",
            asistencia: asistenciaExistente,
        });

    } catch (error) {
        res.status(500).json({
            error: "Error al actualizar la asistencia",
            details: error.message,
        });
    }
}

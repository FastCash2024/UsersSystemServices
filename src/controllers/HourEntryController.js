import { EntryTimeModel } from "../models/HourEntryModel.js";

export const registerEntryTime = async (req, res) => { 
    const { horaEntrada, estadosDeAsistencia } = req.body;
    const entryId = "67d8af7f8f7e8fe77bcf1e7b"; // ID del documento a actualizar

    try {
        const updatedEntry = await EntryTimeModel.findByIdAndUpdate(
            entryId,
            { horaEntrada, estadosDeAsistencia, fechaEntrada: new Date().toISOString().split('T')[0] },
            { new: true, upsert: false } // new: true devuelve el documento actualizado, upsert: false evita crear uno nuevo
        );

        if (!updatedEntry) {
            return res.status(404).json({
                success: false,
                message: "No se encontró el registro de entrada para actualizar.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Hora de entrada actualizada correctamente.",
            data: updatedEntry,
        });
    } catch (error) {
        console.error("Error al actualizar la hora de entrada: ", error);
        return res.status(500).json({
            success: false,
            message: "Hubo un error al actualizar la hora de entrada.",
        });
    }
};

export const getEntryTimeForToday = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const entryTime = await EntryTimeModel.findOne({ _id: "67d8af7f8f7e8fe77bcf1e7b" });

        if (!entryTime) {
            return res.status(404).json({
                message: "No se encontró un registro de hora de entrada para hoy.",
            });
        }

        return res.status(200).json({
            data: entryTime,
        });
    } catch (error) {
        console.error("Error al obtener la hora de entrada de hoy: ", error);
        return res.status(500).json({
            success: false,
            message: "Hubo un error al obtener la hora de entrada de hoy.",
        });
    }
};

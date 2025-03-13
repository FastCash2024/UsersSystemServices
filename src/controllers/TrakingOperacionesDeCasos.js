import moment from 'moment';
import TrakingOperacionesDeCasos from '../models/TrakingOperacionesDeCasos.js';

export const createTrackings = async (req, res) => {
  try {
    const { acotacionesAuditor, ...data } = req.body; // Excluimos acotacionesAuditor
    const newTracking = new TrakingOperacionesDeCasos(data);
    await newTracking.save();
    res.status(201).json({ message: "Registro creado sin acotacionesAuditor", data: newTracking });
  } catch (error) {
    res.status(500).json({ message: "Error al crear el registro.".error.message });
  }
};

export const createTracking = async (tracking) => {
  try {
    const newTracking = new TrakingOperacionesDeCasos(tracking);
    await newTracking.save();
    return "Tracking registrado";
  } catch (error) {
    return `Error al crear el tracking: ${error.message}`;
  }
};



export const getTrackings = async (req, res) => {
  try {
    const { cuentaOperadora, cuentaPersonal, fechaDeOperacion, limit = 10, page = 1 } = req.query;

    const filter = {};
    if (cuentaOperadora) filter.cuentaOperadora = { $regex: cuentaOperadora, $options: "i" };
    if (cuentaPersonal) filter.cuentaPersonal = { $regex: cuentaPersonal, $options: "i" };

    if (fechaDeOperacion) {
      const fechaInicio = moment(fechaDeOperacion).startOf('day').toISOString();
      const fechaFin = moment(fechaDeOperacion).endOf('day').toISOString();
      filter.fechaDeOperacion = {
        $gte: fechaInicio,
        $lte: fechaFin
      };
    }

    const totalDocuments = await TrakingOperacionesDeCasos.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / limit);

    const records = await TrakingOperacionesDeCasos.find(filter)
      .sort({ _id: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      data: records,
      currentPage: parseInt(page),
      totalPages,
      totalDocuments,
    });
  } catch (error) {
    console.error("Error al obtener tracking:", error);
    res.status(500).json({ message: "Error al obtener los registros." });
  }
};

export const updateTrackingById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTracking = await TrakingOperacionesDeCasos.findByIdAndUpdate(
      id,
      { $set: updateData }, // Se actualizan los campos enviados
      { new: true, runValidators: true }
    );

    if (!updatedTracking) {
      return res.status(404).json({ message: "Registro no encontrado" });
    }

    res.json({ message: "Registro actualizado correctamente", data: updatedTracking });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el registro.".error.message });
  }
};

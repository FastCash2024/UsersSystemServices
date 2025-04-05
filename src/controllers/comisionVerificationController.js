import ComisionVerificationCollection from "../models/ComisionVerificationCollection.js";


export const createComisionVerification = async (req, res) => {
    try {
        const { comisionPorAprobacion } = req.body;
        const newComision = new ComisionVerificationCollection({ comisionPorAprobacion });
        await newComision.save();
        res.status(201).json(newComision);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la comisión.', details: error.message });
    }
};

export const getAllComisionVerification = async (req, res) => {
    try {
        const comisiones = await ComisionVerificationCollection.find();
        res.status(200).json(comisiones);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las comisiones.', details: error.message });
    }
};

export const getComisionVerification = async (req, res) => {
    try {
        const comision = await ComisionVerificationCollection.findById(req.params.id);
        if (!comision) {
            return res.status(404).json({ message: 'Comisión no encontrada.' });
        }
        res.status(200).json(comision);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la comisión.', details: error.message });
    }
};

export const updateComisionVerificationById = async (req, res) => {
    try {
        const { comisionPorAprobacion } = req.body;
        const updatedComision = await ComisionVerificationCollection.findByIdAndUpdate(
            req.params.id,
            { comisionPorAprobacion },
            { new: true }
        );
        if (!updatedComision) {
            return res.status(404).json({ message: 'Comisión no encontrada.' });
        }
        res.status(200).json(updatedComision);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la comisión.', details: error.message });
    }
};

export const deleteComisionVerificationById = async (req, res) => {
    try {
        const deletedComision = await ComisionVerificationCollection.findByIdAndDelete(req.params.id);
        if (!deletedComision) {
            return res.status(404).json({ message: 'Comisión no encontrada.' });
        }
        res.status(200).json({ message: 'Comisión eliminada correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la comisión.', details: error.message });
    }
};
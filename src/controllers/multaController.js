import moment from "moment";
import MultaCollection from "../models/MultaCollection.js";
import { obtenerFechaMexicoISO } from "../utilities/date.js";

export const addMulta = async (req, res) => {
    try {
        const { cuentaAuditor, cuentaPersonalAuditor, importeMulta, cuentaOperativa, cuentaPersonal, fechaDeOperacion, fechaDeAuditoria, acotacion, observaciones, seccionMulta, estadoMulta, nombreAuditor} = req.body;

        const nuevaMulta = new MultaCollection({
            cuentaAuditor,
            cuentaPersonalAuditor,
            importeMulta,
            cuentaOperativa,
            cuentaPersonal,
            fechaDeOperacion,
            fechaDeAuditoria,
            acotacion,
            seccionMulta,
            observaciones,
            estadoMulta,
            nombreAuditor
        });

        await nuevaMulta.save();
        res.status(201).json(nuevaMulta);
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar la multa', details: error.message });
    }
};

export const editMulta = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const multa = await MultaCollection.findById(id);
        if (!multa) {
            return res.status(404).json({ message: 'Multa no encontrada' });
        }

        Object.assign(multa, updateData);

        await multa.save();
        res.status(200).json(multa);
    } catch (error) {
        res.status(500).json({ message: 'Error al editar la multa', details: error.message });
    }
};

export const deleteMulta = async (req, res) => {
    try {
        const { id } = req.params;

        const multa = await MultaCollection.findById(id);
        if (!multa) {
            return res.status(404).json({ message: 'Multa no encontrada' });
        }

        await multa.remove();
        res.status(200).json({ message: 'Multa eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la multa', details: error.message });
    }
};

export const getMultaById = async (req, res) => {
    try {
        const { id } = req.params;

        const multa = await MultaCollection.findById(id);
        if (!multa) {
            return res.status(404).json({ message: 'Multa no encontrada' });
        }

        res.status(200).json(multa);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la multa', details: error.message });
    }
};

export const getAllMultas = async (req, res) => {
    try {
        const { cuentaAuditor, cuentaPersonalAuditor, cuentaOperativa, cuentaPersonal, fechaInicioOperacion, fechaFinOperacion, fechaInicioAuditoria, fechaFinAuditoria, page = 1, limit = 10 } = req.query;

        const limitInt = parseInt(limit, 10);
        const pageInt = parseInt(page, 10);

        const filter = {};
        if (cuentaOperativa) {
            filter.cuentaOperativa = cuentaOperativa;
        }
        if (cuentaPersonal) {
            filter.cuentaPersonal = cuentaPersonal;
        }
        if (cuentaAuditor) {
            filter.cuentaAuditor = cuentaAuditor;
        }
        if (cuentaPersonalAuditor) {
            filter.cuentaPersonalAuditor = cuentaPersonalAuditor;
        }
        if (fechaInicioOperacion && fechaFinOperacion) {
            filter.fechaDeOperacion = {
                $gte: new Date(fechaInicioOperacion),
                $lte: new Date(fechaFinOperacion)
            };
        }
        if (fechaInicioAuditoria && fechaFinAuditoria) {
            filter.fechaDeAuditoria = {
                $gte: new Date(fechaInicioAuditoria),
                $lte: new Date(fechaFinAuditoria)
            };
        }

        const totalDocuments = await MultaCollection.countDocuments(filter);

        const multas = await MultaCollection.find(filter)
            .sort({_id: -1})
            .skip((pageInt - 1) * limitInt)
            .limit(limitInt);

        const totalPages = Math.ceil(totalDocuments / limitInt);

        res.status(200).json({
            data: multas,
            currentPage: pageInt,
            totalPages,
            totalDocuments
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las multas', details: error.message });
    }
};

export const getReporteDiarioMultas = async (req, res) => {
    try {
        const { fecha } = req.query;
        const today = fecha || moment().format('DD/MM/YYYY');

        const filter = {
            $expr: {
                $eq: [
                    {
                        $dateToString: {
                            format: '%d/%m/%Y',
                            date: { $toDate: '$fechaDeAuditoria' },
                        },
                    },
                    today,
                ],
            },
        };

        const multasDelDia = await MultaCollection.find(filter);

        if (multasDelDia.length === 0) {
            return res.json({
                data: {},
                message: `No se encontraron multas del día ${today}.`,
            });
        }

        const resultado = {};

        multasDelDia.forEach((multa) => {
            const tipo = multa.cuentaAuditor || 'Desconocido';
            const observacion = multa.observaciones || 'Sin Observaciones';
            const esMultado = observacion === 'Con Observaciones';

            if (!resultado[tipo]) {
                resultado[tipo] = {
                    multados10am: 0,
                    multados12am: 0,
                    multados14pm: 0,
                    multados16pm: 0,
                    multadosTotal: 0,
                    sinMulta10am: 0,
                    sinMulta12am: 0,
                    sinMulta14pm: 0,
                    sinMulta16pm: 0,
                    sinMultaTotal: 0,
                };
            }

            const hora = obtenerFechaMexicoISO(multa.fechaDeAuditoria);

            if (hora >= 7 && hora <= 10) {
                esMultado ? resultado[tipo].multados10am++ : resultado[tipo].sinMulta10am++;
            } else if (hora > 10 && hora <= 12) {
                esMultado ? resultado[tipo].multados12am++ : resultado[tipo].sinMulta12am++;
            } else if (hora > 12 && hora <= 14) {
                esMultado ? resultado[tipo].multados14pm++ : resultado[tipo].sinMulta14pm++;
            } else if (hora > 14 && hora < 24) {
                esMultado ? resultado[tipo].multados16pm++ : resultado[tipo].sinMulta16pm++;
            }

            esMultado ? resultado[tipo].multadosTotal++ : resultado[tipo].sinMultaTotal++;
        });

        Object.keys(resultado).forEach((tipo) => {
            resultado[tipo].multados12am += resultado[tipo].multados10am;
            resultado[tipo].multados14pm += resultado[tipo].multados12am;
            resultado[tipo].multados16pm += resultado[tipo].multados14pm;
            resultado[tipo].sinMulta12am += resultado[tipo].sinMulta10am;
            resultado[tipo].sinMulta14pm += resultado[tipo].sinMulta12am;
            resultado[tipo].sinMulta16pm += resultado[tipo].sinMulta14pm;
        });

        res.json({ data: resultado });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los datos'.error.message });
    }
};

export const getReporteDiarioTotalesMultas = async (req, res) => {
    try {
        const { fecha } = req.query;
        const today = fecha || moment().format('DD/MM/YYYY');

        const filter = {
            $expr: {
                $eq: [
                    {
                        $dateToString: {
                            format: '%d/%m/%Y',
                            date: { $toDate: '$fechaDeAuditoria' },
                        },
                    },
                    today,
                ],
            },
        };

        const multasDelDia = await MultaCollection.find(filter);

        if (multasDelDia.length === 0) {
            return res.json({
                data: {
                    totalesGenerales: {
                        multados10am: 0,
                        multados12am: 0,
                        multados14pm: 0,
                        multados16pm: 0,
                        multadosTotal: 0,
                        sinMulta10am: 0,
                        sinMulta12am: 0,
                        sinMulta14pm: 0,
                        sinMulta16pm: 0,
                        sinMultaTotal: 0
                    },
                },
                message: `No se encontraron multas del día ${today}.`,
            });
        }

        // Inicializamos los totales generales
        const totalesGenerales = {
            multados10am: 0,
            multados12am: 0,
            multados14pm: 0,
            multados16pm: 0,
            multadosTotal: 0,
            sinMulta10am: 0,
            sinMulta12am: 0,
            sinMulta14pm: 0,
            sinMulta16pm: 0,
            sinMultaTotal: 0
        };

        multasDelDia.forEach((multa) => {
            const observacion = multa.observaciones || 'Sin Observaciones';
            const esMultado = observacion === 'Con Observaciones';

            const hora = obtenerFechaMexicoISO(multa.fechaDeAuditoria);

            if (hora >= 7 && hora <= 10) {
                esMultado ? totalesGenerales.multados10am++ : totalesGenerales.sinMulta10am++;
            } else if (hora > 10 && hora <= 12) {
                esMultado ? totalesGenerales.multados12am++ : totalesGenerales.sinMulta12am++;
            } else if (hora > 12 && hora <= 14) {
                esMultado ? totalesGenerales.multados14pm++ : totalesGenerales.sinMulta14pm++;
            } else if (hora > 14 && hora < 24) {
                esMultado ? totalesGenerales.multados16pm++ : totalesGenerales.sinMulta16pm++;
            }

            esMultado ? totalesGenerales.multadosTotal++ : totalesGenerales.sinMultaTotal++;
        });

        totalesGenerales.multados12am += totalesGenerales.multados10am;
        totalesGenerales.multados14pm += totalesGenerales.multados12am;
        totalesGenerales.multados16pm += totalesGenerales.multados14pm;

        totalesGenerales.sinMulta12am += totalesGenerales.sinMulta10am;
        totalesGenerales.sinMulta14pm += totalesGenerales.sinMulta12am;
        totalesGenerales.sinMulta16pm += totalesGenerales.sinMulta14pm;

        res.json({ totalesGenerales });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los datos', error: error.message });
    }
};

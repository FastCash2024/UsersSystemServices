import mongoose from 'mongoose';

const ComisionVerificationSchema = new mongoose.Schema({
    
    comisionPorAprobacion: {
        type: Number,
        required: true
    }
}, {
    timestamps: true,
    collection: 'comisionVerification'
});

export default mongoose.model('ComisionVerification', ComisionVerificationSchema);

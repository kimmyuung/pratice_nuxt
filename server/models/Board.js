import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true
    },
    writer: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    hitno: {
        type: Number,
        default: 0
    }
}, {
    timestamps: { createdAt: 'regDate', updatedAt: 'updatedAt' }
});

export const Board = mongoose.models.Board || mongoose.model('Board', boardSchema);

import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            length: 4,
        },
        content: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Note = mongoose.model("Note", noteSchema);

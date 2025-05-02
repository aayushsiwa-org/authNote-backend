import { Request, Response } from "express";
import { Note } from "../models/note.model";

// Helper: extract userId from user email or object
const getUserId = (user: any): string => {
    // console.log(user.id, user.email);
    return user.id;
};

// GET all notes of a user
export const getNotes = async (req: Request, res: Response) => {
    try {
        const userId = getUserId((req as any).user);
        const notes = await Note.find({ id: { $regex: `^${userId}` } }).sort({
            updatedAt: -1,
        });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch notes", error });
    }
};

// GET note by ID
export const getNoteById = async (
    req: Request,
    res: Response
): Promise<void> => {
    const userId = getUserId((req as any).user);
    const noteId = req.params.id;
    try {
        if (!noteId.startsWith(userId)) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        const note = await Note.findOne({ id: noteId });
        if (!note) {
            res.status(404).json({ message: "Note not found" });
        } else {
            res.json(note);
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

// POST create a new note
export const createNote = async (req: Request, res: Response) => {
    try {
        const userId = getUserId((req as any).user);
        const noteId = Math.random().toString(36).substring(2, 8);
        const id = `${userId}${noteId}`;
        const note = new Note({ id, content: req.body.content });
        await note.save();
        res.status(201).json(note);
    } catch (err) {
        res.status(400).json({ message: "Failed to create note", err });
    }
};

// PUT update a note
export const updateNote = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = getUserId((req as any).user);
        const noteId = req.params.id;

        if (!noteId.startsWith(userId)) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const updated = await Note.findOneAndUpdate(
            { id: noteId },
            { content: req.body.content },
            { new: true }
        );

        if (!updated) {
            res.status(404).json({ message: "Note not found" });
            return;
        }

        res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ message: "Failed to update note", err });
    }
};

// DELETE a note
export const deleteNote = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = getUserId((req as any).user);
        const noteId = req.params.id;

        if (!noteId.startsWith(userId)) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const deleted = await Note.findOneAndDelete({ id: noteId });

        if (!deleted) {
            res.status(404).json({ message: "Note not found" });
            return;
        }

        res.sendStatus(204);
    } catch (err) {
        res.status(500).json({ message: "Failed to delete note", err });
    }
};

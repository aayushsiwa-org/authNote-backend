import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import {
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
} from "../controllers/notes.controller";

const router = Router();

router.get("/", authenticateJWT, getNotes);
router.get("/:id", authenticateJWT, getNoteById);
router.post("/", authenticateJWT, createNote);
router.put("/:id", authenticateJWT, updateNote);
router.delete("/:id", authenticateJWT, deleteNote);

export default router;

import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import cors from "cors";
import session from "express-session";
import "./config/passport";

import authRoutes from "./routes/auth.routes";
import notesRoutes from "./routes/notes.routes";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "secret",
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/api/notes", notesRoutes);

// connect to mongodb
const dbUrl=`${process.env.DB_URL || "mongodb://localhost:27017"}/authNotes`
mongoose
    .connect(dbUrl)
    .then(() => console.log("connected to ",dbUrl))
    .catch((err) => console.error("couldn't connect to mongodb:", err));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

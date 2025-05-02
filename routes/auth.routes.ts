import { Router } from "express";
import passport from "passport";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { login, register } from "../controllers/auth.controller"; // ✅ Import controller functions
import { User } from "../models/user.model";

dotenv.config();
const router = Router();

// Extend Express User type
declare global {
    namespace Express {
        interface User {
            _id: string;
            email: string;
            name: string;
            displayName?: string;
            emails?: { value: string }[];
            provider?: string;
            profilePicture?: string;
        }
    }
}

// ===== Google OAuth Routes =====
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ message: "Authentication failed" });
                return next();
            }

            // Extract email from user object
            let email = user.email;
            if (!email && user.emails && user.emails.length > 0) {
                email = user.emails[0].value;
            }

            // Create a JWT token for the user
            const token = jwt.sign(
                {
                    id: user._id, // Use the MongoDB ID
                    email: email,
                    name: user.name || user.displayName,
                    provider: user.provider,
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // Redirect to the frontend with the token
            res.redirect(`http://localhost:5173?token=${token}`);
            return next();
        } catch (error) {
            next(error);
        }
    }
);

// ===== Local Auth Routes =====
router.post("/register", (req, res, next) => {
    register(req, res).catch(next); // Handle async errors
}); // ✅ Uses controller

router.post("/login", (req, res, next) => {
    login(req, res).catch(next); // Handle async errors
}); // ✅ Uses controller

export default router;

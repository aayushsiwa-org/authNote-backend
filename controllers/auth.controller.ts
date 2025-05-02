import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

const JWT_SECRET = process.env.JWT_SECRET!;

// Register a new user
export const register = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res
                .status(409)
                .json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, name });
        await user.save();

        return res
            .status(201)
            .json({ message: "User registered successfully" });
    } catch (err) {
        return res
            .status(500)
            .json({ message: "Registration failed", error: err });
    }
};

// Login user
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Missing email or password" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({ message: "Invalid credentials" });

        const validPassword = user.password
            ? await bcrypt.compare(password, user.password)
            : false;
        if (!validPassword)
            return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({ token });
    } catch (err) {
        return res.status(500).json({ message: "Login failed", error: err });
    }
};

// save user from third party providers
// save user from third party providers
export const saveUser = async (userData: any) => {
    try {
        // Check if user exists by provider ID or email
        let user = await User.findOne({
            $or: [{ googleId: userData.googleId }, { email: userData.email }],
        });

        if (user) {
            // User exists, update any new information if needed
            user.displayName = userData.displayName || user.displayName;
            user.profilePicture =
                userData.profilePicture || user.profilePicture;
            // Add additional fields as needed

            // Save any updates
            await user.save();
            return user; // Return the updated user
        } else {
            // Create new user from OAuth data
            const newUser = new User({
                providerId: userData.googleId || userData.githubId,
                email: userData.email,
                name: userData.displayName,
                profilePicture: userData.profilePicture,
                // No password for OAuth users
            });

            await newUser.save();
            return newUser; // Return the newly created user
        }
    } catch (error) {
        console.error("Error saving OAuth user:", error);
        throw error; // Re-throw to handle in the passport callback
    }
};

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

// Get JWT secret from environment variables with fallback
const JWT_SECRET = process.env.JWT_SECRET!;
// Token expiration time (longer for better UX)
const TOKEN_EXPIRY = "7d"; // Set to 7 days instead of 1 hour

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
    const { email, password, username } = req.body;
    
    // Validate required fields
    if (!email || !password || !username) {
        return res.status(400).json({ 
            message: "Missing required fields", 
            details: {
                email: !email ? "Email is required" : null,
                password: !password ? "Password is required" : null,
                username: !username ? "Username is required" : null
            }
        });
    }
    
    try {
        // Check if user already exists with this email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }
        
        // Check if username is taken
        const existingUsername = await User.findOne({ name: username });
        if (existingUsername) {
            return res.status(409).json({ message: "Username already taken" });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const user = new User({ 
            email, 
            password: hashedPassword, 
            name: username,
            provider: 'local'
        });
        
        await user.save();
        
        // Generate token
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email, 
                name: user.name,
                provider: user.provider
            },
            JWT_SECRET as string,
            { expiresIn: TOKEN_EXPIRY }
        );
        
        // Return token to client
        return res.status(201).json({ 
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({ 
            message: "Registration failed", 
            error: process.env.MODE === 'development' ? err : undefined
        });
    }
};

/**
 * Login an existing user
 */
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({ message: "Missing email or password" });
    }
    
    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Check if user has a password (OAuth users may not)
        if (!user.password) {
            return res.status(401).json({ 
                message: "This account uses a social login method. Please use that method to sign in."
            });
        }
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Generate token
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email, 
                name: user.name,
                provider: user.provider
            },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );
        // console.log(token)
        
        // Return token to client
        return res.status(200).json({ 
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ 
            message: "Login failed", 
            error: process.env.MODE === 'development' ? err : undefined
        });
    }
};

/**
 * Save or update user from third-party OAuth providers
 */
export const saveUser = async (userData: any) => {
    try {
        // Check if user exists by provider ID or email
        let user = await User.findOne({
            $or: [
                { providerId: userData.providerId },
                { email: userData.email },
            ],
        });
        
        if (user) {
            // User exists, update any new information
            user.name = userData.displayName || user.name;
            user.displayName = userData.displayName || user.displayName;
            user.profilePicture = userData.profilePicture || user.profilePicture;
            user.provider = userData.provider || user.provider;
            
            // Save updates
            await user.save();
            return user;
        } else {
            // Create new user from OAuth data
            const newUser = new User({
                providerId: userData.googleId || userData.githubId,
                email: userData.email,
                name: userData.displayName,
                displayName: userData.displayName,
                profilePicture: userData.profilePicture,
                provider: userData.provider || 'google',
                // No password for OAuth users
            });
            
            await newUser.save();
            return newUser;
        }
    } catch (error) {
        console.error("Error saving OAuth user:", error);
        throw error;
    }
};

/**
 * Get current user information
 */
export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        return res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                displayName: user.displayName,
                profilePicture: user.profilePicture,
                provider: user.provider
            }
        });
    } catch (error) {
        console.error("Error fetching current user:", error);
        return res.status(500).json({ message: "Failed to get user information" });
    }
};

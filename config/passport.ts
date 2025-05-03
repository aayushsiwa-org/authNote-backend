import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { saveUser } from "../controllers/auth.controller"; // Import saveUser function
import { User } from "../models/user.model";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: "/auth/google/callback",
        },
        async function (accessToken, refreshToken, profile, done) {
            try {
                // Create the user object matching the User type
                const userData = {
                    googleId: profile.id,
                    displayName: profile.displayName,
                    name: profile.displayName, // Use displayName as name initially
                    email: profile.emails?.[0]?.value,
                    emails:
                        profile.emails?.map((email) => ({
                            value: email.value,
                        })) || [],
                    provider: "google",
                    profilePicture: profile.photos?.[0]?.value,
                };

                // Call the saveUser function to save/retrieve the user from the database
                const savedUser = await saveUser(userData);

                // Pass null as first arg (no error) and the user as second arg
                return done(null, savedUser);
            } catch (error) {
                // Pass the error as first arg when there's an error
                return done(error, undefined);
            }
        }
    )
);

// Serialize user for the session
passport.serializeUser((user: Express.User, done) => {
    done(null, user._id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
    try {
        // Here you would find the user by ID in your database
        // For a simple implementation:
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

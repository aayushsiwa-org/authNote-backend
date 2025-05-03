import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const JWT_SECRET = process.env.JWT_SECRET!;
  // console.log(JWT_SECRET)
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.error("JWT Verification Error:", err.message);
        return res.sendStatus(403); // Invalid token
      }
      (req as any).user = user;
      next();
    });
  } else {
    res.sendStatus(401); // No token provided
  }
}
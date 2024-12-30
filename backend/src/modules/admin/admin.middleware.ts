

import { Response, NextFunction , Request } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import * as InterFace from './admin.interface'
import Redis from 'ioredis'
import adminResponse from "./admin.response";

// Middleware to validate JWT token
// Middleware to validate JWT token without 'Bearer' prefix
const validateJWT = (req: InterFace.AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Extract token directly from the Authorization header
        const token = req.headers.authorization;

        if (!token) {
            return adminResponse.sendAuthError(res, { message: "Unauthorized: No token provided" ,  statusCode: 401 });
        }

        // Verify the token
        const decoded = jwt.verify(token, config.JWT_SECRET as string);

        // Attach decoded token to the request object for later use
        req.user = decoded;

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        return adminResponse.sendAuthError(res, { message:  "Unauthorized: Invalid token" , statusCode: 401});

    }
};

interface RateLimiterOptions {
    rateLimitWindow?: number;  // Time window in seconds
    rateLimitMaxHits?: number; // Max allowed hits in the window
    blockDuration?: number;    // Block duration in seconds
}

// Rate limiter middleware function
export const rateLimiter = ({
    rateLimitWindow = 20, // Time window in seconds
    rateLimitMaxHits = 5, // Max allowed hits in the window
    blockDuration = 300,  // Block duration in seconds
}: RateLimiterOptions = {}) => {
    return async (req: InterFace.AuthRequest, res: Response, next: NextFunction) => {
        const ip = req.ip;

        try {
            const redis = new Redis(config.REDIS_CONN);
            // Check if the IP is blocked
            const isBlocked = await redis.get(`block:${ip}`);

            if (isBlocked) {
                return adminResponse.sendError(res, { message: "Too many requests. Try again later."});
            }

            // Increment the API hit count for the IP
            const currentHits = await redis.incr(`hits:${ip}`);
            if (currentHits === 1) {
                // Set expiry for the hit count key on the first hit
                await redis.expire(`hits:${ip}`, rateLimitWindow);
            }

            if (currentHits > rateLimitMaxHits) {
                // Block the IP if it exceeds the rate limit
                await redis.set(`block:${ip}`, '1', 'EX', blockDuration);
                return adminResponse.sendError(res, { message: "Too many requests. You have been blocked for 5 minutes." });
            }

            // Proceed to the next middleware or route handler
            next();
        } catch (error) {
            console.error("Rate Limiter Error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    };
};

// Pagination middleware

export const paginationMiddleware = (
    req: InterFace.AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    // Default values if page and limit are not provided
    try {
        const defaultPage = 1;
        const defaultLimit = 10;
      
        // Parse page and limit from query parameters, or use defaults
        const { page = defaultPage, limit = defaultLimit } = req.query;
      
        // Ensure page and limit are valid positive integers
        const pageNumber = Math.max(Number(page), 1);
        const pageSize = Math.max(Number(limit), 1);
      
        // Attach pagination details to the request object
        req.pagination = {
          offset: (pageNumber - 1) * pageSize, // Calculate offset for the query
          limit: pageSize,                     // Max records per page
          page: pageNumber,                    // Current page number
        };
        if(isNaN(req.pagination.offset) ||  isNaN(req.pagination.limit))  {
            return res.status(500).json({ message: "Pagination Error: invalid page limit query" });
        }
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Pagination Error:", error);
        res.status(500).json({ message: "Pagination Error:" });
    }

  };
  

export default validateJWT;

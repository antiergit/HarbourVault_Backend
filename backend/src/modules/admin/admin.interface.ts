import { Request, Router } from "express";

interface ApiResponse {
    status: number
    message: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: Record<string, any> // You can use Record<string, any> as a flexible type for data
}

interface ApiError {
    message: string;    
    error?: object;
    statusCode? : number
}

interface ControllerInterface {
    path: string,
    router: Router,
    initializeRoutes: () => void
  }

// Define the Payload interface
interface Payload {
      email: string,
      password: string,
      twoFACode?: string
  } 

interface AuthRequest extends Request {
    pagination?: any, 
    user?: any, // Custom property to store the decoded token
    ip: any;
}
  
export { ApiResponse, ApiError, Payload , AuthRequest,  ControllerInterface }
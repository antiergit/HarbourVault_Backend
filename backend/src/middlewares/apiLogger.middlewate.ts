import type { NextFunction, Request, Response } from "express";
import "colors";

const apiLogger = (req: Request, res: Response, next: NextFunction) => {
  const now = new Date();
  console.log(`${now.toISOString()} - ${req.method}`.green + ` ${req.url}`.yellow);
  next();
};

export default apiLogger;

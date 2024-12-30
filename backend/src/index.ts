import { Server as HTTPServer, createServer } from "http";
import express, { NextFunction, Request, Response } from "express";
import { ServerInterface } from "./interfaces/server.interface";
import { encryptionMiddleware } from "./middlewares/encryption.middleware";
import { GlblCode, GlblMessages, InfoMessages } from "./constants/global_enum";
import controllers from "./modules/controllers.index";
import expressFileUploader from "express-fileupload";
import { ValidationError } from 'express-validation';
import { config } from "./config";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import apiLogger from "./middlewares/apiLogger.middlewate";
import os from "node:os";
import bodyParser from 'body-parser';

const swaggerUi = require('swagger-ui-express');
console.log("apth",path)
const swaggerDocument = require('./swagger.json');
const basicAuth = require('express-basic-auth');

// Initialize swagger-jsdoc


class Server implements ServerInterface {
  public app: express.Application;
  public httpServer: HTTPServer;

  constructor() {
    this.app = express();
    this.app.use(apiLogger)
    this.httpServer = createServer(this.app);
    // Middleware setup
    this.app.use(expressFileUploader());
    this.app.use(helmet());
    this.app.use(helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        "frame-ancestors": "'none'",
      },
    }));
    this.app.use(helmet.dnsPrefetchControl());
    this.app.use(helmet.expectCt());
    this.app.use(helmet.frameguard({ action: "deny" }));
    this.app.use(helmet.hidePoweredBy());
    this.app.use(helmet.hsts());
    this.app.use(helmet.ieNoOpen());
    this.app.use(helmet.noSniff());
    this.app.use(helmet.permittedCrossDomainPolicies());
    this.app.use(helmet.referrerPolicy());

    // Additional headers for security
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      next();
    });

    // Body parsing middleware
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // CORS and static files
    this.app.use(cors());
    this.app.use('/api/v1/static', express.static(path.join(__dirname, 'public')));
    this.app.use(express.static(path.join(__dirname, 'public')));

    // View setup
    this.app.set('views', './views');
    this.app.use(bodyParser.json());

    // Encryption middleware
    this.app.use(encryptionMiddleware);

    // Initialize controllers and services
    this.initializeControllers();
    // Basic authentication middleware for Swagger UI
    this.app.use('/KU8S5Ln7siecCst', basicAuth({
      users: { 'dJVMRqXSW7i5c8G': '8o8qoWbnSG4FlZc' }, // Set your username and password here
      challenge: true, // Shows the login prompt
      unauthorizedResponse: 'Unauthorized access', // Response message if unauthorized
    }));
    this.app.use('/KU8S5Ln7siecCst', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    
    this.startServer();
    this.initializeHealthCheck();

    // Global error handler
    this.app.use(this.errorHandler);
  }

  // Error handler middleware
  private errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.log('Error occurred:', err);
    console.error('Error details: ', err.details);
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json({
        statusCode: err.statusCode,
        message: err.message,
        name: err.name,
        error: err.error,
      });
    }
    return res.status(GlblCode.NOT_FOUND).json({
      statusCode: GlblCode.NOT_FOUND,
      message: GlblMessages.CATCH_MSG,
    });
  }
  public startServer() {
    this.httpServer.listen(config.PORT, () => {
      console.log("\x1b[32m\x1b[1mServer started on port \x1b[33m" + config.PORT + "\x1b[0m");
    });

    // Route for root
    this.app.get("/", (req: Request, res: Response) => {
      res.send(InfoMessages.APP_INFO).status(GlblCode.SUCCESS);
    });

    // Transaction success route
    this.app.get('/transaction-success', (req, res) => {
      res.sendFile(__dirname + '/views/index.html');
    });

    // Light & Dark themed routes for privacy, terms, and about us
    this.setupPdfRoute('/privacy', 'web-privacy-policy', 'light');
    this.setupPdfRoute('/terms-and-conditions', 'web-terms-and-conditions', 'light');
    this.setupPdfRoute('/about-us', 'about-us', 'light');
    this.setupPdfRoute('/privacy', 'web-privacy-policy', 'dark');
    this.setupPdfRoute('/terms-and-conditions', 'web-terms-and-conditions', 'dark');
    this.setupPdfRoute('/about-us', 'about-us', 'dark');

    // Apple App Site Association
    this.app.get("/apple-app-site-association", (req, res) => {
      res.set('Content-Type', 'application/pkcs7-mime');
      res.status(200);
      res.sendFile(__dirname + "/apple-app-site-association");
    });

    // Global error handling
    process.on('uncaughtException', (err) => {
      console.log('Caught exception >>>>' + err);
    });
  }

  // Helper function to set up PDF routes for both light and dark themes
  private setupPdfRoute(route: string, filename: string, theme: string) {
    const themePath = theme === 'light' ? '' : `/${theme}`;
    const filePath = `/public/pdf/${filename}${themePath}.html`;
    // Dynamically register route for both light and dark themes
    this.app.get(`${route}${themePath}`, (req, res) => {
      res.sendFile(__dirname + filePath);
    });
  }


  public initializeControllers() {
    const url: string = `/api/v1`;
    controllers.forEach((controller) => {
      this.app.use(url, controller.router);
    });
  }

  public initializeHealthCheck() {
    this.app.get("/health", (req: Request, res: Response) => {
      const heap = {
        total: process.memoryUsage().heapTotal,
        used: process.memoryUsage().heapUsed,
      };
      const systemInfo = {
        uptime: os.uptime(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        cpuUsage: process.cpuUsage(),
      };
    
      // Combine all information
      const data = {
        heap,
        systemInfo,
      };
    
      res.status(200).json(data); // Send the health status as a JSON response
    });
  }
}

new Server();

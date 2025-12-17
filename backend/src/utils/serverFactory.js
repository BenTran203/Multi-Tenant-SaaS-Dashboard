import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import fs from "fs";
import path from "path";

/**
 * Creates an HTTP or HTTPS server based on environment
 * @param {Express.Application} app
 */

export const createWebServer = (app) => {
  let httpServer;
  const useHttps =
    process.env.NODE_ENV === "production" || process.env.USE_HTTPS === "true";
  if (useHttps) {
    try {
      const httpsOptions = {
        key: fs.readFileSync(path.join(process.cwd(), "certs", "key.pem")),
        cert: fs.readFileSync(path.join(process.cwd(), "certs", "cert.pem")),
      };
      httpServer = createHttpsServer(httpsOptions, app);
      console.log("HTTPS server created");
    } catch (error) {
      console.error("HTTPS certificates not found, using HTTP instead");
      httpServer = createServer(app);
    }
  }
  return httpServer;
};

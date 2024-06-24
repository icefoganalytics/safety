import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import fileUpload from "express-fileupload";
import { API_PORT, AUTH0_DOMAIN, FRONTEND_URL } from "./config";
import { doHealthCheck } from "./utils/healthCheck";
import { locationRouter, directoryRouter, reportRouter, roleRouter, userRouter, departmentRouter } from "./routes";
import { checkJwt, loadUser } from "./middleware/authz.middleware";
import migrator from "./data/migrator";

const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(
  fileUpload({
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  })
);
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "default-src": ["'self'", FRONTEND_URL, AUTH0_DOMAIN],
      "base-uri": ["'self'"],
      "block-all-mixed-content": [],
      "font-src": ["'self'", "https:", "data:"],
      "frame-ancestors": ["'self'"],
      "img-src": ["'self'", "data:"],
      "object-src": ["'none'"],
      "script-src": ["'self'", "'unsafe-eval'"],
      "script-src-attr": ["'none'"],
      "style-src": ["'self'", "https:", "'unsafe-inline'"],
      "worker-src": ["'self'", "blob:"],
      "connect-src": ["'self'", FRONTEND_URL, AUTH0_DOMAIN],
    },
  })
);

// very basic CORS setup
app.use(
  cors({
    origin: FRONTEND_URL,
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

app.get("/api/healthCheck", (req: Request, res: Response) => {
  doHealthCheck(req, res);
});

app.use("/migrate", migrator.migrationRouter);

app.use("/api/directory", directoryRouter);
app.use("/api/department", departmentRouter);
app.use("/api/location", locationRouter);

app.use("/api/reports", checkJwt, loadUser, reportRouter);
app.use("/api/user", checkJwt, loadUser, userRouter);
app.use("/api/role", checkJwt, loadUser, roleRouter);

// serves the static files generated by the front-end
app.use(express.static(path.join(__dirname, "web")));

// if no other routes match, just send the front-end
app.use((req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "web") + "/index.html");
});

const PORT: number = parseInt(API_PORT as string);

app.listen(PORT, async () => {
  console.log(`Safety API listenting on port ${PORT}`);
});

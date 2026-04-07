import { authenticatedMiddleware } from "./auth";
import { authSessionHandler } from "./handlers/auth-session";
import { healthcheckHandler } from "./handlers/healthcheck";
import {
  errorHandlingMiddleware,
  loggingMiddleware,
  validationMiddleware
} from "./middlewares";
import { createLambdaEntry } from "./shared/lambda";

export const healthcheck = createLambdaEntry(healthcheckHandler, [
  errorHandlingMiddleware,
  validationMiddleware,
  loggingMiddleware
]);

export const authSession = createLambdaEntry(authSessionHandler, [
  errorHandlingMiddleware,
  validationMiddleware,
  loggingMiddleware,
  authenticatedMiddleware
]);

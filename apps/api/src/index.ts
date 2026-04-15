import { authenticatedMiddleware } from "./auth";
import { authSessionHandler } from "./handlers/auth-session";
import { createMatchHandler } from "./handlers/create-match";
import { getMatchHandler } from "./handlers/get-match";
import { healthcheckHandler } from "./handlers/healthcheck";
import { joinMatchHandler } from "./handlers/join-match";
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

export const createMatch = createLambdaEntry(createMatchHandler, [
  errorHandlingMiddleware,
  validationMiddleware,
  loggingMiddleware,
  authenticatedMiddleware
]);

export const getMatch = createLambdaEntry(getMatchHandler, [
  errorHandlingMiddleware,
  validationMiddleware,
  loggingMiddleware,
  authenticatedMiddleware
]);

export const joinMatch = createLambdaEntry(joinMatchHandler, [
  errorHandlingMiddleware,
  validationMiddleware,
  loggingMiddleware,
  authenticatedMiddleware
]);

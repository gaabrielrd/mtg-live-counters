export type StageName = "dev" | "staging";

export interface StageConfig {
  stage: StageName;
  region: string;
  projectName: string;
  prefix: string;
  hostedUiDomainPrefix: string;
  webCallbackUrls: string[];
  webLogoutUrls: string[];
  webOrigins: string[];
  googleClientId?: string;
  googleClientSecret?: string;
}

const DEFAULT_REGION = "us-east-1";
const PROJECT_NAME = "mtg-live-counters";

function readOptionalStageSecret(stage: StageName, key: string) {
  return process.env[`${stage.toUpperCase()}_${key}`] ?? process.env[key];
}

function readStageUrls(stage: StageName, key: string, fallback: string[]) {
  const rawValue = readOptionalStageSecret(stage, key);

  if (!rawValue) {
    return fallback;
  }

  const parsedUrls = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return parsedUrls.length > 0 ? parsedUrls : fallback;
}

function extractOrigins(urls: string[]) {
  return [...new Set(urls.map((url) => new URL(url).origin))];
}

function createStageConfig(stage: StageName): StageConfig {
  const prefix = `${PROJECT_NAME}-${stage}`;
  const webCallbackUrls = readStageUrls(stage, "WEB_CALLBACK_URLS", [
    "http://localhost:5173/auth/callback",
    "http://localhost:5173"
  ]);
  const webLogoutUrls = readStageUrls(stage, "WEB_LOGOUT_URLS", [
    "http://localhost:5173"
  ]);

  return {
    stage,
    region: process.env.AWS_REGION ?? DEFAULT_REGION,
    projectName: PROJECT_NAME,
    prefix,
    hostedUiDomainPrefix: `${prefix}-auth`,
    webCallbackUrls,
    webLogoutUrls,
    webOrigins: extractOrigins([...webCallbackUrls, ...webLogoutUrls]),
    googleClientId: readOptionalStageSecret(stage, "GOOGLE_CLIENT_ID"),
    googleClientSecret: readOptionalStageSecret(stage, "GOOGLE_CLIENT_SECRET")
  };
}

export function getStageConfigs(requestedStage?: StageName): StageConfig[] {
  if (requestedStage) {
    return [createStageConfig(requestedStage)];
  }

  return [createStageConfig("dev"), createStageConfig("staging")];
}

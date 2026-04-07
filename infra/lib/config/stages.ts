export type StageName = "dev" | "staging";

export interface StageConfig {
  stage: StageName;
  region: string;
  projectName: string;
  prefix: string;
  hostedUiDomainPrefix: string;
  webCallbackUrls: string[];
  webLogoutUrls: string[];
  googleClientId?: string;
  googleClientSecret?: string;
}

const DEFAULT_REGION = "us-east-1";
const PROJECT_NAME = "mtg-live-counters";

function readOptionalStageSecret(stage: StageName, key: string) {
  return process.env[`${stage.toUpperCase()}_${key}`] ?? process.env[key];
}

function createStageConfig(stage: StageName): StageConfig {
  const prefix = `${PROJECT_NAME}-${stage}`;

  return {
    stage,
    region: process.env.AWS_REGION ?? DEFAULT_REGION,
    projectName: PROJECT_NAME,
    prefix,
    hostedUiDomainPrefix: `${prefix}-auth`,
    webCallbackUrls: [
      "http://localhost:5173/auth/callback",
      "http://localhost:5173"
    ],
    webLogoutUrls: ["http://localhost:5173"],
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

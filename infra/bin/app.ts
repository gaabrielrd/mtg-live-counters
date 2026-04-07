import * as cdk from "aws-cdk-lib";
import { getStageConfigs, type StageName } from "../lib/config/stages";
import { ApiStack } from "../lib/stacks/api-stack";
import { ApiGatewayAccountStack } from "../lib/stacks/api-gateway-account-stack";
import { AuthStack } from "../lib/stacks/auth-stack";
import { DataStack } from "../lib/stacks/data-stack";
import { FrontendStack } from "../lib/stacks/frontend-stack";
import { RealtimeStack } from "../lib/stacks/realtime-stack";

const app = new cdk.App();
const requestedStage = app.node.tryGetContext("stage") as StageName | undefined;

const stages = getStageConfigs(requestedStage);
const sharedStageConfig = stages[0];

if (!sharedStageConfig) {
  throw new Error("At least one stage configuration is required.");
}

const apiGatewayAccountStack = new ApiGatewayAccountStack(
  app,
  `${sharedStageConfig.projectName}-apigateway-account`,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: sharedStageConfig.region
    },
    stageConfig: sharedStageConfig
  }
);

cdk.Tags.of(apiGatewayAccountStack).add("project", sharedStageConfig.projectName);
cdk.Tags.of(apiGatewayAccountStack).add("stage", "shared");
cdk.Tags.of(apiGatewayAccountStack).add("managed-by", "cdk");

for (const stageConfig of stages) {
  const commonEnv = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: stageConfig.region
  };

  const dataStack = new DataStack(app, `${stageConfig.prefix}-data`, {
    env: commonEnv,
    stageConfig
  });

  const authStack = new AuthStack(app, `${stageConfig.prefix}-auth`, {
    env: commonEnv,
    stageConfig
  });

  const frontendStack = new FrontendStack(app, `${stageConfig.prefix}-frontend`, {
    env: commonEnv,
    stageConfig
  });

  const apiStack = new ApiStack(app, `${stageConfig.prefix}-api`, {
    env: commonEnv,
    stageConfig
  });

  const realtimeStack = new RealtimeStack(app, `${stageConfig.prefix}-realtime`, {
    env: commonEnv,
    stageConfig,
    dataTableName: dataStack.table.tableName
  });
  realtimeStack.addDependency(apiGatewayAccountStack);

  [dataStack, authStack, frontendStack, apiStack, realtimeStack].forEach((stack) => {
    cdk.Tags.of(stack).add("project", stageConfig.projectName);
    cdk.Tags.of(stack).add("stage", stageConfig.stage);
    cdk.Tags.of(stack).add("managed-by", "cdk");
  });

  void authStack;
}

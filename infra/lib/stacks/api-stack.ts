import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lambda from "aws-cdk-lib/aws-lambda";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BaseStack, type BaseStackProps } from "./base-stack";

const stackDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiAssetPath = path.resolve(stackDirectory, "../../../apps/api");

export interface ApiStackProps extends BaseStackProps {
  authUserPoolId: string;
  authUserPoolClientId: string;
  authIssuer: string;
}

export class ApiStack extends BaseStack {
  constructor(scope: import("constructs").Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const accessLogGroup = new logs.LogGroup(this, "HttpApiAccessLogs", {
      logGroupName: `/aws/apigateway/${this.createName("http-api")}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy:
        this.stageConfig.stage === "dev"
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN
    });

    const commonEnvironment = {
      API_CORS_ALLOW_ORIGINS: this.stageConfig.webOrigins.join(","),
      COGNITO_REGION: this.stageConfig.region,
      COGNITO_USER_POOL_ID: props.authUserPoolId,
      COGNITO_USER_POOL_CLIENT_ID: props.authUserPoolClientId,
      COGNITO_ISSUER: props.authIssuer
    };

    const healthcheckLambda = new lambda.Function(this, "HealthcheckLambda", {
      functionName: this.createName("http-healthcheck"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "dist/index.healthcheck",
      code: lambda.Code.fromAsset(apiAssetPath),
      environment: commonEnvironment,
    });

    const authSessionLambda = new lambda.Function(this, "AuthSessionLambda", {
      functionName: this.createName("http-auth-session"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "dist/index.authSession",
      code: lambda.Code.fromAsset(apiAssetPath),
      environment: commonEnvironment,
    });

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: this.createName("http-api"),
      createDefaultStage: false,
      corsPreflight: {
        allowHeaders: ["authorization", "content-type"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS
        ],
        allowOrigins: this.stageConfig.webOrigins
      }
    });

    const healthIntegration = new integrations.HttpLambdaIntegration(
      "HealthIntegration",
      healthcheckLambda
    );
    const authSessionIntegration = new integrations.HttpLambdaIntegration(
      "AuthSessionIntegration",
      authSessionLambda
    );

    httpApi.addRoutes({
      path: "/health",
      methods: [apigwv2.HttpMethod.GET],
      integration: healthIntegration
    });

    httpApi.addRoutes({
      path: "/auth/session",
      methods: [apigwv2.HttpMethod.GET],
      integration: authSessionIntegration
    });

    const stage = new apigwv2.HttpStage(this, "HttpStage", {
      httpApi,
      stageName: this.stageConfig.stage,
      autoDeploy: true,
      accessLogSettings: {
        destination: new apigwv2.LogGroupLogDestination(accessLogGroup),
        format: apigw.AccessLogFormat.custom(
          JSON.stringify({
            requestId: "$context.requestId",
            routeKey: "$context.routeKey",
            status: "$context.status",
            requestTime: "$context.requestTime",
            ip: "$context.identity.sourceIp"
          })
        )
      }
    });

    new CfnOutput(this, "HttpApiUrl", {
      value: stage.url
    });

    new CfnOutput(this, "HttpApiId", {
      value: httpApi.apiId
    });

    new CfnOutput(this, "HttpApiAccessLogGroupName", {
      value: accessLogGroup.logGroupName
    });
  }
}

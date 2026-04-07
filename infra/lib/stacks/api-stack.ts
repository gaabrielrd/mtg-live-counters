import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
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
  dataTable: dynamodb.ITable;
  dataTableName: string;
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
      COGNITO_ISSUER: props.authIssuer,
      GAME_TABLE_NAME: props.dataTableName
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

    const createMatchLambda = new lambda.Function(this, "CreateMatchLambda", {
      functionName: this.createName("http-create-match"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "dist/index.createMatch",
      code: lambda.Code.fromAsset(apiAssetPath),
      environment: commonEnvironment
    });

    const getMatchLambda = new lambda.Function(this, "GetMatchLambda", {
      functionName: this.createName("http-get-match"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "dist/index.getMatch",
      code: lambda.Code.fromAsset(apiAssetPath),
      environment: commonEnvironment
    });

    props.dataTable.grantReadWriteData(createMatchLambda);
    props.dataTable.grantReadData(getMatchLambda);

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
    const createMatchIntegration = new integrations.HttpLambdaIntegration(
      "CreateMatchIntegration",
      createMatchLambda
    );
    const getMatchIntegration = new integrations.HttpLambdaIntegration(
      "GetMatchIntegration",
      getMatchLambda
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

    httpApi.addRoutes({
      path: "/matches",
      methods: [apigwv2.HttpMethod.POST],
      integration: createMatchIntegration
    });

    httpApi.addRoutes({
      path: "/matches/{matchId}",
      methods: [apigwv2.HttpMethod.GET],
      integration: getMatchIntegration
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

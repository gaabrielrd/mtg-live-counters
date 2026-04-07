import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { BaseStack, type BaseStackProps } from "./base-stack";

export class ApiStack extends BaseStack {
  constructor(scope: import("constructs").Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const accessLogGroup = new logs.LogGroup(this, "HttpApiAccessLogs", {
      logGroupName: `/aws/apigateway/${this.createName("http-api")}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy:
        this.stageConfig.stage === "dev"
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN
    });

    const healthcheckLambda = new lambda.Function(this, "HealthcheckLambda", {
      functionName: this.createName("http-healthcheck"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async () => ({
          statusCode: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            status: "ok",
            service: "api",
            source: "cdk-placeholder",
            timestamp: new Date().toISOString()
          })
        });
      `)
    });

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: this.createName("http-api"),
      createDefaultStage: false
    });

    const healthIntegration = new integrations.HttpLambdaIntegration(
      "HealthIntegration",
      healthcheckLambda
    );

    httpApi.addRoutes({
      path: "/health",
      methods: [apigwv2.HttpMethod.GET],
      integration: healthIntegration
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

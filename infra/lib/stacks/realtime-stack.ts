import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { BaseStack, type BaseStackProps } from "./base-stack";

export interface RealtimeStackProps extends BaseStackProps {
  dataTableName: string;
}

export class RealtimeStack extends BaseStack {
  constructor(
    scope: import("constructs").Construct,
    id: string,
    props: RealtimeStackProps
  ) {
    super(scope, id, props);

    const accessLogGroup = new logs.LogGroup(this, "WebSocketAccessLogs", {
      logGroupName: `/aws/apigateway/${this.createName("websocket-api")}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy:
        this.stageConfig.stage === "dev"
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN
    });

    const websocketApi = new apigwv2.CfnApi(this, "WebSocketApi", {
      name: this.createName("websocket-api"),
      protocolType: "WEBSOCKET",
      routeSelectionExpression: "$request.body.action"
    });

    const routeLambdaRole = new iam.Role(this, "RealtimeLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      ]
    });

    const routeHandler = new lambda.Function(this, "RealtimeRouteHandler", {
      functionName: this.createName("websocket-route-handler"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      role: routeLambdaRole,
      environment: {
        GAME_TABLE_NAME: props.dataTableName
      },
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => ({
          statusCode: 200,
          body: JSON.stringify({
            routeKey: event.requestContext?.routeKey ?? "$default",
            message: "websocket placeholder route",
            timestamp: new Date().toISOString()
          })
        });
      `)
    });

    const integration = new apigwv2.CfnIntegration(this, "WebSocketIntegration", {
      apiId: websocketApi.ref,
      integrationType: "AWS_PROXY",
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${routeHandler.functionArn}/invocations`
    });

    ["$connect", "$disconnect", "$default"].forEach((routeKey, index) => {
      new apigwv2.CfnRoute(this, `WebSocketRoute${index}`, {
        apiId: websocketApi.ref,
        routeKey,
        authorizationType: "NONE",
        target: `integrations/${integration.ref}`
      });
    });

    new lambda.CfnPermission(this, "WebSocketInvokePermission", {
      action: "lambda:InvokeFunction",
      functionName: routeHandler.functionName,
      principal: "apigateway.amazonaws.com",
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${websocketApi.ref}/*`
    });

    const stage = new apigwv2.CfnStage(this, "WebSocketStage", {
      apiId: websocketApi.ref,
      stageName: this.stageConfig.stage,
      autoDeploy: true,
      accessLogSettings: {
        destinationArn: accessLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: "$context.requestId",
          routeKey: "$context.routeKey",
          connectionId: "$context.connectionId",
          eventType: "$context.eventType",
          requestTime: "$context.requestTime"
        })
      },
      defaultRouteSettings: {
        dataTraceEnabled: true,
        loggingLevel: "INFO"
      }
    });

    new CfnOutput(this, "WebSocketApiId", {
      value: websocketApi.ref
    });

    new CfnOutput(this, "WebSocketApiEndpoint", {
      value: `wss://${websocketApi.ref}.execute-api.${this.region}.amazonaws.com/${stage.stageName}`
    });

    new CfnOutput(this, "WebSocketAccessLogGroupName", {
      value: accessLogGroup.logGroupName
    });
  }
}

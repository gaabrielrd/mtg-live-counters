import { RemovalPolicy } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import { BaseStack, type BaseStackProps } from "./base-stack";

export class ApiGatewayAccountStack extends BaseStack {
  readonly cloudWatchRoleArn: string;

  constructor(scope: import("constructs").Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const logRole = new iam.Role(this, "ApiGatewayCloudWatchRole", {
      roleName: `${this.stageConfig.projectName}-apigateway-cloudwatch-role`,
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
        )
      ]
    });

    new apigateway.CfnAccount(this, "ApiGatewayAccount", {
      cloudWatchRoleArn: logRole.roleArn
    });

    new logs.LogGroup(this, "ApiGatewayExecutionLogsRetentionAnchor", {
      logGroupName: `/aws/apigateway/${this.stageConfig.projectName}-account`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.RETAIN
    });

    this.cloudWatchRoleArn = logRole.roleArn;
  }
}

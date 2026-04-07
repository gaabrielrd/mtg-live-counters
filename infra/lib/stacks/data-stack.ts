import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { BaseStack, type BaseStackProps } from "./base-stack";

export class DataStack extends BaseStack {
  readonly table: dynamodb.Table;

  constructor(scope: import("constructs").Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    this.table = new dynamodb.Table(this, "GameTable", {
      tableName: this.createName("game-table"),
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: this.stageConfig.stage !== "dev"
      },
      removalPolicy:
        this.stageConfig.stage === "dev"
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "GSI1PK",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "GSI1SK",
        type: dynamodb.AttributeType.STRING
      }
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: {
        name: "GSI2PK",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "GSI2SK",
        type: dynamodb.AttributeType.STRING
      }
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI3",
      partitionKey: {
        name: "GSI3PK",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "GSI3SK",
        type: dynamodb.AttributeType.STRING
      }
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI4",
      partitionKey: {
        name: "GSI4PK",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "GSI4SK",
        type: dynamodb.AttributeType.STRING
      }
    });

    new CfnOutput(this, "GameTableName", {
      value: this.table.tableName
    });
  }
}

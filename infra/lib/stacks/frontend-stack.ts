import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import { BaseStack, type BaseStackProps } from "./base-stack";

export class FrontendStack extends BaseStack {
  constructor(scope: import("constructs").Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: this.createName("frontend"),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      autoDeleteObjects: this.stageConfig.stage === "dev",
      removalPolicy:
        this.stageConfig.stage === "dev"
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN
    });

    const distribution = new cloudfront.Distribution(this, "FrontendDistribution", {
      comment: `${this.stageConfig.prefix} frontend`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(5)
        }
      ]
    });

    new CfnOutput(this, "FrontendBucketName", {
      value: bucket.bucketName
    });

    new CfnOutput(this, "FrontendDistributionDomainName", {
      value: distribution.distributionDomainName
    });
  }
}

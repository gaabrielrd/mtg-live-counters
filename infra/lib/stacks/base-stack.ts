import { Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import type { StageConfig } from "../config/stages";

export interface BaseStackProps extends StackProps {
  stageConfig: StageConfig;
}

export abstract class BaseStack extends Stack {
  protected readonly stageConfig: StageConfig;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);
    this.stageConfig = props.stageConfig;
  }

  protected createName(suffix: string) {
    return `${this.stageConfig.prefix}-${suffix}`;
  }
}

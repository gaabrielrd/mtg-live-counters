import { CfnOutput } from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { BaseStack, type BaseStackProps } from "./base-stack";

export class AuthStack extends BaseStack {
  readonly userPool: cognito.UserPool;
  readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: import("constructs").Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const preSignUpTrigger = new lambda.Function(this, "PreSignUpTrigger", {
      functionName: this.createName("pre-sign-up"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          event.response = {
            ...event.response,
            autoConfirmUser: true,
            autoVerifyEmail: true
          };

          return event;
        };
      `)
    });

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: this.createName("user-pool"),
      selfSignUpEnabled: true,
      signInAliases: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false
        }
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      lambdaTriggers: {
        preSignUp: preSignUpTrigger
      },
      passwordPolicy: {
        minLength: 12,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: false
      }
    });

    const hasGoogleAuth =
      Boolean(this.stageConfig.googleClientId) &&
      Boolean(this.stageConfig.googleClientSecret);

    let googleIdentityProvider:
      | cognito.UserPoolIdentityProviderGoogle
      | undefined;

    if (hasGoogleAuth) {
      googleIdentityProvider = new cognito.UserPoolIdentityProviderGoogle(
        this,
        "GoogleIdentityProvider",
        {
          userPool: this.userPool,
          clientId: this.stageConfig.googleClientId!,
          clientSecret: this.stageConfig.googleClientSecret!,
          scopes: ["openid", "email", "profile"],
          attributeMapping: {
            email: cognito.ProviderAttribute.GOOGLE_EMAIL,
            givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
            familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
            profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE
          }
        }
      );
    }

    const domain = this.userPool.addDomain("HostedUiDomain", {
      cognitoDomain: {
        domainPrefix: this.stageConfig.hostedUiDomainPrefix
      }
    });

    this.userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: this.createName("web-client"),
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      oAuth: {
        callbackUrls: this.stageConfig.webCallbackUrls,
        logoutUrls: this.stageConfig.webLogoutUrls,
        flows: {
          authorizationCodeGrant: true
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE
        ]
      },
      supportedIdentityProviders: hasGoogleAuth
        ? [
            cognito.UserPoolClientIdentityProvider.COGNITO,
            cognito.UserPoolClientIdentityProvider.GOOGLE
          ]
        : [cognito.UserPoolClientIdentityProvider.COGNITO]
    });

    if (googleIdentityProvider) {
      this.userPoolClient.node.addDependency(googleIdentityProvider);
    }

    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId
    });

    new CfnOutput(this, "UserPoolIssuer", {
      value: this.userPool.userPoolProviderUrl
    });

    new CfnOutput(this, "HostedUiDomain", {
      value: domain.baseUrl()
    });

    new CfnOutput(this, "GoogleProviderConfigured", {
      value: hasGoogleAuth ? "true" : "false"
    });
  }
}

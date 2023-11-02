import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';


export class truckLogisticsChallengeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //the DynamoDB table for storing Logs
    const table = new dynamodb.Table(this, 'truckLogisticsDataTable', {
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 20,
      writeCapacity: 20,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName:"truckLogisticsLog"
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', { value: table.tableName });



    // the Lambda for handling POST requests
    const postLambda = new lambdaNodejs.NodejsFunction(this, 'PostTruckLogLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'src/lambda/postTruckLogs.ts',
      architecture: lambda.Architecture.ARM_64,
      memorySize: 128,
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    //grant IAM policies for writing to dynamoDB
    table.grantWriteData(postLambda);

    // the Lambda for handling GET requests
    const getLambda = new lambdaNodejs.NodejsFunction(this, 'GetTruckLogsLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'src/lambda/getTruckLogs.ts',
      architecture: lambda.Architecture.ARM_64,
      memorySize: 128,
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    //grant IAM policies for reading DynamoDB
    table.grantReadData(getLambda);


    //construct for the API gateway
    const api = new apigateway.RestApi(this, 'TruckLogApi', {
      restApiName: 'Truck Log Service',
      description: 'Service for GETTING and POSTING truck logs',
    });

    const truckLogs = api.root.addResource('truck-logs');
    const apiKey = api.addApiKey('ApiKey', {
      apiKeyName: 'TruckLogApiKey',
      description: 'API Key for Truck Log API',

    });

    const postIntegration = new apigateway.LambdaIntegration(postLambda);
    const getIntegration = new apigateway.LambdaIntegration(getLambda);

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: 'TruckLogApiUsagePlan',
      description: 'Truck Log API Usage Plan',
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },

    });

    usagePlan.addApiKey(apiKey);

    const postMethod = truckLogs.addMethod('POST', postIntegration, {
      apiKeyRequired: true,
    });

    const getMethod = truckLogs.addMethod('GET', getIntegration, {
      apiKeyRequired: true,
    });

    usagePlan.addApiStage({
      stage: api.deploymentStage,
      throttle: [
        {
          method: postMethod,
          throttle: {
            rateLimit: 10,
            burstLimit: 20,
          },
        },
        {
          method: getMethod,
          throttle: {
            rateLimit: 10,
            burstLimit: 20,
          },
        },
      ],
    });




  }
}

import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import TruckLog from '../models/TruckLog';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler: APIGatewayProxyHandler = async (event) => {
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 10;
    const deviceId = event.queryStringParameters?.deviceId;

    let params: AWS.DynamoDB.DocumentClient.QueryInput | AWS.DynamoDB.DocumentClient.ScanInput;

    if (deviceId) {
        // If deviceId is provided, query the table
        params = {
            TableName: TABLE_NAME,
            KeyConditionExpression: 'deviceId = :deviceId',
            ExpressionAttributeValues: { ':deviceId': deviceId },
            Limit: limit,
        };
    } else {
        // If deviceId is not provided, scan the table instead
        params = {
            TableName: TABLE_NAME,
            Limit: limit,
        };
    }

    try {
        const result = deviceId
            ? await dynamoDb.query(params as AWS.DynamoDB.DocumentClient.QueryInput).promise()
            : await dynamoDb.scan(params as AWS.DynamoDB.DocumentClient.ScanInput).promise();

        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: 'No truck logs found' }),
            };
        }

        //compare timestamps to display in descending order
        const logs = (result.Items as TruckLog[]).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logs),
        };
    } catch (error) {
        console.error('Error retrieving truck logs:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};

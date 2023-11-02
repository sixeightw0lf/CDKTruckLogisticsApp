import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import TruckLog from '../models/TruckLog';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

if (!TABLE_NAME) {
    throw new Error('TABLE_NAME environment variable is not set');
}

export const handler: APIGatewayProxyHandler = async (event) => {

    // no body, return HTTP error 400
    if (!event.body) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Invalid request: Body is empty' }),
        };
    }

    //try parsing the request
    let truckLog: TruckLog;
    try {
        truckLog = JSON.parse(event.body);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Invalid request: Body is not valid JSON' }),
        };
    }

    //deviceID and timestamp required for PK/SK and proper logging
    if (!truckLog.deviceId || !truckLog.timestamp) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Invalid truck log: deviceId and timestamp are required' }),
        };
    }

    try {
        //truck log meta is optional, recording lambda processing timestamp for auditing purposes
        truckLog.metadata = truckLog.metadata || {};
        truckLog.metadata.logProcessedAt = new Date().toISOString(); // Set the timestamp of lambda processing at point in time

        const params = {
            TableName: TABLE_NAME,
            Item: truckLog,
        };

        await dynamoDb.put(params).promise();

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Truck log created successfully' }),
        };


    } catch (error) {
        console.error('Error writing to DynamoDB:', error);

        // If error has validation props
        if (error instanceof Error) {
            return error.name === 'ValidationException'
                ? {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: `Invalid truck log: ${error.message}` }),
                }
                : {
                    statusCode: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: 'Internal Server Error' }),
                };
        }

        // if theres no instance of error, return a generic 500 error
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
}

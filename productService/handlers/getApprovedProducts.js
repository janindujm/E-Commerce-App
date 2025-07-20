const {DynamoDBClient, ScanCommand} = require('@aws-sdk/client-dynamodb');

const dynamoDbClient = new DynamoDBClient({region:'us-east-2'});

exports.getApprovedProducts = async () => {
    try {

        const tableName = process.env.DYNAMO_TABLE;
        const scanCommand = new ScanCommand({
            TableName : tableName,
            FilterExpression : "isApproved = :trueVal",
            ExpressionAttributeValues: {
                ":trueVal":{BOOL: true}
            }
        });

        //Excecute scan comman and retrieve matching items from the database
        const data = await dynamoDbClient.send(scanCommand);

        //Retuurn a success response with the 
        return {
            statusCode: 200,
            body: JSON.stringify({ data }),
        };


    } catch (error) {
        return{
            statusCode:500,
            body: JSON.stringify({error:error.message}),
        };
        
    }
    
};
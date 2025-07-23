const {DynamoDBClient, UpdateItemCommand} = require('@aws-sdk/client-dynamodb');
const dynamoDbClient = new DynamoDBClient({region: 'us-east-2'});

exports.updateOrderStatus = async (event) => {
    try {
        // Extract order ID and new status from the request body
        const {id} = event;

        // Validate required fields
        if (!orderId) {
            return {
                statusCode: 400,
                body: JSON.stringify({error: "Order ID  required"}),
            };
        }

        // Update the order status in DynamoDB
        const updateCommand = new UpdateItemCommand({
            TableName: process.env.DYNAMO_TABLE,
            Key: { id: { S: id } },
            UpdateExpression: "set #s = :newStatus",
            ExpressionAttributeNames: { "#s": "status" },  
            ExpressionAttributeValues: { ":newStatus": { S: "processing" } },
        });

        const result = await dynamoDbClient.send(updateCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({message: `Order ${id} status updated successfully`}),
        };
    } catch (error) {
        console.error("Error updating order status:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: error.message}),
        };
    }
};
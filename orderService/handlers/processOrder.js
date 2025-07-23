//Import Dynamodb client
const {DynamoDBClient, PutItemCommand} = require('@aws-sdk/client-dynamodb');



//Create new DynamoDB client
const dynamodbClient = new DynamoDBClient({region: 'us-east-2'});


//Lambda function to process the order
exports.processOrder = async (event) => {
   
    try {
        //Loop throught each record in the event
        for (const record of event.Records) {
            //Extract the message body from the SQS record
            const messageBody = JSON.parse(record.body);

            //Extract order details from the message body
            const {id,productId, quantity, email,status, createdAt} = messageBody;


            //Prepare the item to be stored in DynamoDB
            const item = {
                id: {S: id},
                productId: {S: productId},
                quantity: {N: quantity.toString()},
                email: {S: email},
                status: {S: status},
                createdAt: {S: createdAt},
            };

            //Store the order in DynamoDB
            const putCommand = new PutItemCommand({
                TableName: process.env.DYNAMO_TABLE,
                Item: item,
            });

            await dynamodbClient.send(putCommand);

            console.log(`Order  processed successfully`);
        }
        
    } catch (error) {
        console.error("Error processing order:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: "Internal Server Error"}),
        };
        
    }
}
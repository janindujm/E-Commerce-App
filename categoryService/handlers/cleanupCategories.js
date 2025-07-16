//Import required AWS SDK modules for DynamoDB
const {DynamoDBClient, ScanCommand, DeleteItemCommand} = require('@aws-sdk/client-dynamodb');

//Import required AWS SDK modules for SNS
const {SNSClient, PublishCommand} = require('@aws-sdk/client-sns');

//Initialize the DynamoDB client instance with the specified region
const dynamoDbClient = new DynamoDBClient({region: 'us-east-2'}); //Specify the AWS region where your DynamoDB table 
const snsClient = new SNSClient({region: 'us-east-2'});//Specify the AWS region where your SNS topic is  

//Define the Cleanup function to remove outdated categories

exports.cleanupCategories = async () => {
    try {
        //Get the DyanmoDb table name from environment variables
        const tableName = process.env.DYNAMO_TABLE; //Get the DynamoDB table name from environment variables
        const snsTopicARN = process.env.SNS_TOPIC_ARN; //Get the SNS topic ARN from environment variables

        //Calculate the timestamp for 1 hour ago(to filter outdated categories)
        const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString(); //1 hour ago timestamp

        //Create a scan command to find categories that are:
        //Older than one hour(createdAt < OneHourAgo)
        //That do not have an image url field
        const scanCommand = new ScanCommand({
            TableName: tableName, //DynamoDB table name
            FilterExpression: "createdAt < :oneHourAgo AND attribute_not_exists(imageUrl)", //Filter categories older than one hour and without imageUrl
            ExpressionAttributeValues: {
                ":oneHourAgo": {S: oneHourAgo}, //Bind the Timestamp for filtering
            },
        });

        //Execute the scan command to get outdated categories
        const {Items} = await dynamoDbClient.send(scanCommand);

        //If no Items are found, return a success response indicating no clean up was needed
        if (!Items || Items.length === 0) {
            return {
                statusCode: 200, //HTTP status code for successful request
                body: JSON.stringify({
                    message: "No outdated categories found", //Success message
                }),
            };
        }

        //Initialize a counter to keep track of deleted categories
        let deletedCount = 0;

        //Iterate over each outdated and delete if from the database
        for(const item of Items) {
            //Create a delete command using the catagory unique identifier(fileName)
            const deleteCommand = new DeleteItemCommand({
                TableName: tableName, //DynamoDB table name
                Key: {
                    fileName: {S: item.fileName.S}, //Key to identify the item to be deleted
                },
            });

            //Execute the delete command
            await dynamoDbClient.send(deleteCommand);
            deletedCount++; //Increment the deleted count
        }
        //send an SNS notification after deleting categories
        const snsMessage = `Cleanup completed: ${deletedCount} outdated categories deleted.`;

        await snsClient.send(new PublishCommand({
            TopicArn: snsTopicARN, //SNS topic ARN to publish the message
            Message: snsMessage, //Message to be sent
            Subject: "Category Cleanup Notification", //Subject of the SNS message
        }));

        //Return a success response indicating the number of deleted categories
        return {
            statusCode: 200, //HTTP status code for successful request
            body: JSON.stringify({
                message: `${deletedCount} outdated categories deleted successfully`, //Success message with count of deleted categories
            }),
        };
        
    } catch (error) {
        return {
            statusCode: 500, //HTTP status code for internal server error
            body: JSON.stringify({
                message: "An error occurred while cleaning up categories", //Error message
                error: error.message, //Include the error message from the exception
            }),
        };
        
    }
}

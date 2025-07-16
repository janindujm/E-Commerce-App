//Import necessary AWS SDk modules for dynamodb
const {DynamoDBClient, UpdateItemCommand , ScanCommand} = require('@aws-sdk/client-dynamodb');


//Initialize a DynamoDB client instance with the specified region
const dynamoDbClient = new DynamoDBClient({
    region: 'us-east-2', //Specify the AWS region where your DynamoDB table is located
});

 exports.updateProductImage = async (event) => {
    try {
        //Retrive table name from env variable
        const tableName = process.env.DYNAMO_TABLE; //Get the DynamoDB table name from environment variables
        //Extract the first record from the event
        const record = event.Records[0]; //Get the first record from the event

        //Get the s3 Bucket name from environment variables
        const bucketName = record.s3.bucket.name; //Get the S3 bucket name

        //Extract file name from the S3 event record
        const fileName = record.s3.object.key; //File name from the S3 object

                //construct the public url for the uploaded image
        const imageUrl = `https://${bucketName}.s3.us-east-2.amazonaws.com/${fileName}`; //Public URL for the uploaded file

        //Find the id using fileName
        const scanCommand = new ScanCommand({
            TableName: tableName, //DynamoDB table name
            FilterExpression: "fileName = :fileName", //Filter to find the item with the specified fileName
            ExpressionAttributeValues: {
                ":fileName": {S: fileName}, //File name to filter by
            },
        });

        //Scan results to find the product id
        const scanResult = await dynamoDbClient.send(scanCommand);

        if (!scanResult.Items || scanResult.Items.length === 0) {
            return {
                statusCode: 404, //HTTP status code for not found
                body: JSON.stringify({
                    message: "Product not found", //Error message
                }),
            };
        }

        const productId = scanResult.Items[0].id.S; //Extract the product id from the scan result



        //Prepare the Dynamodb update command
        const updateItemCommand = new UpdateItemCommand({
            TableName: tableName, //DynamoDB table name
            Key:{id: {S: productId}}, //Key to identify the item to be updated
            UpdateExpression: "SET imageUrl = :imageUrl", //Only update the imageUrl and uploadTime attributes field
            ExpressionAttributeValues: {
                ":imageUrl": {S: imageUrl}, //New image URL to be set
            },
        });

        //Excecute the update command to update the item in DynamoDB
        await dynamoDbClient.send(updateItemCommand);

        return {
            statusCode: 200, //HTTP status code for successful request
            body: JSON.stringify({
                message: "Category image updated successfully", //Success message
                imageUrl: imageUrl, //Return the updated image URL
            }),
        };


    } catch (error) {
        return {
            statusCode: 500, //HTTP status code for internal server error
            body: JSON.stringify({
                message: "An error occurred while updating the category image", //Error message
                error: error.message, //Include the error message in the response
            }),
        };
        
    }
}
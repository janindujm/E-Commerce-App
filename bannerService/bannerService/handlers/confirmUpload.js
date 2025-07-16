//Import necessary AWS SDk modules for dynamodb
const {DynamoDBClient , PutItemCommand} = require('@aws-sdk/client-dynamodb');

//Initialize a DynamoDB client instance with the specified region
const dynamoDbClient = new DynamoDBClient({
    region: 'us-east-2', //Specify the AWS region where your DynamoDB table is located
});

//Lambda function to confirm the upload of a banner image
exports.confirmUpload = async (event) => {
    try {
        const tableName = process.env.DYNAMO_TABLE; //Get the DynamoDB table name from environment variables
        const bucketName = process.env.BUCKET_NAME; //Get the S3 bucket name from environment variables

        //Extract file details from s3 event notification
        const record = event.Records[0]; //Get the first record from the event

        //extract file name and type from the S3 event record
        const fileName = record.s3.object.key; //File name from the S3 object key
        //construct the public Url for the uploaded file
        const imageUrl = `https://${bucketName}.s3.us-east-2.amazonaws.com/${fileName}`; //Public URL for the uploaded file
                        //https://banner-images-bucket-janindujm-dev-123-new.s3.us-east-2.amazonaws.com/banner1.png

        //Prepare the file metadata to be stored in DynamoDB
        const putItemCommand = new PutItemCommand({
            TableName: tableName, //DynamoDB table name
            Item:{
                fileName: {S: fileName}, //File name as a string attribute
                imageUrl: {S: imageUrl}, //Public URL of the uploaded file as a string attribute
                uploadTime: {S: new Date().toISOString()}, //Current time as a string attribute
            }

        });

        //Execute the command to insert the item into DynamoDB
        await dynamoDbClient.send(putItemCommand);

        //Return a success response indicating that the upload has been confirmed
        return {
            statusCode: 200, //HTTP status code for successful request
            body: JSON.stringify({
                message: "Upload confirmed successfully", //Success message
            }),
        };
    } catch (error) {
        return {
            statusCode: 500, //HTTP status code for internal server error
            body: JSON.stringify({
                message: "An error occurred while confirming the upload", //Error message
                error: error.message, //Include the error message in the response
            }),
        };
    }
};
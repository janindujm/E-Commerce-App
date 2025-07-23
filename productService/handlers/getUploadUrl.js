//import required s3 modules from aws sdk
//There are needed to interact with s3 and genarate presigned urls
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');
const {getSignedUrl} = require('@aws-sdk/s3-request-presigner');

//Import necessary AWS SDk modules for dynamodb
const {DynamoDBClient, PutItemCommand} = require('@aws-sdk/client-dynamodb');

// Import UUID for unique file names
const {v4: uuidv4} = require('uuid'); 

//creating an S3 client instance with the specified region

const s3Client = new S3Client({
    region: 'us-east-2', //Specify the AWS region where your S3 bucket
});
const dynamoDbClient = new DynamoDBClient({
    region: 'us-east-2', //Specify the AWS region where your DynamoDB table
});

//Lambda function to genarate a pre-signed URL for S3 file upload
//the url allows client to securely upload a file to s3 bucket without exposing aws credentials

exports.getUploadUrl = async (event) => {
    try {
        const bucketName = process.env.BUCKET_NAME; //Get the bucket name from environment variables

        //Extract email from cognito JWT claims
        const email = event.requestContext.authorizer.jwt.claims.email;

        //parsing the incomin g event body to get filename and fileType
        //FileName is the name of the file to be uploaded
        //FileType is the MIME type of the file to be uploaded

        const {fileName, fileType, productName, productPrice, description, quantity, category} = JSON.parse(event.body);
  
        //Validate the file name and type
        //if either is missing, return an error response
        if (!fileName || !fileType || !productName || !productPrice || !description || !quantity || !category || !email) {
            return {
                statusCode: 400, //HTTP status code for bad request
                body: JSON.stringify({
                    message: "All fields are required", //Error message
                }),
            };
        }

        //creating an S3 PutObjectCommand with the specified bucket, key (file name), and content type
        //this defines the s3 object that will be created/upload  by the file name
        const command = new PutObjectCommand({
            Bucket: bucketName, //S3 bucket name
            Key: fileName, //File name to be uploaded
            ContentType: fileType, //MIME type of the file
        });

        //Generating a pre-signed URL for the S3 PutObjectCommand in 3600 seconds (1 hour)
        //this url allows the client to upload the file directly to S3

        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600, //URL expiration time in seconds
        });
        
        //returning the pre-signed URL in the response body
        //client can use this URL to upload the file directly to S3

        //Save category Details in dynamoDB(Only fileName and categoryName)
        const productId = uuidv4(); // Generate a unique ID for the product
        const putItemCommand = new PutItemCommand({
            TableName: process.env.DYNAMO_TABLE, //DynamoDB table name
            Item: {
                id: {S: productId}, //Unique product ID
                fileName: {S: fileName}, //File name as a string attribute
                productName: {S: productName}, //Product name as a string attribute
                category: {S: category}, //Product category as a string attribute
                productPrice: {N: productPrice.toString()}, //Product price as a number attribute
                description: {S: description}, //Product description as a string attribute
                quantity: {N: quantity.toString()}, //Product quantity as a number attribute
                email: {S: email}, //Email of the user uploading the product
                isApproved: {BOOL: false}, //Approval status of the product
                uploadTime: {S: new Date().toISOString()}, //Current time as a string attribute
            }
        });

        await dynamoDbClient.send(putItemCommand); //Execute the command to insert the item into DynamoDB

        return {
            statusCode: 200, //HTTP status code for successful request
            body: JSON.stringify({
                uploadUrl: signedUrl, //Pre-signed URL for file upload
            }),
        };
    } catch (error) {
        return {
            statusCode: 500, //HTTP status code for internal server error
            body: JSON.stringify({
                message: "Error generating upload URL", //Error message
                error: error.message, //Include the error message from the exception
            }),
        };
        
    }

}
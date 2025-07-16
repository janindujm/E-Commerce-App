//import required s3 modules from aws sdk
//There are needed to interact with s3 and genarate presigned urls
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');
const {getSignedUrl} = require('@aws-sdk/s3-request-presigner');

//creating an S3 client instance with the specified region

const s3Client = new S3Client({
    region: 'us-east-2', //Specify the AWS region where your S3 bucket
});

//Lambda function to genarate a pre-signed URL for S3 file upload
//the url allows client to securely upload a file to s3 bucket without exposing aws credentials

exports.getUploadUrl = async (event) => {
    try {
        const bucketName = process.env.BUCKET_NAME; //Get the bucket name from environment variables

        //parsing the incomin g event body to get filename and fileType
        //FileName is the name of the file to be uploaded
        //FileType is the MIME type of the file to be uploaded

        const {fileName, fileType} = JSON.parse(event.body);

        //Validate the file name and type
        //if either is missing, return an error response
        if (!fileName || !fileType) {
            return {
                statusCode: 400, //HTTP status code for bad request
                body: JSON.stringify({
                    message: "File name and type are required", //Error message
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
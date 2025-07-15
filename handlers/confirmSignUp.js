const {CognitoIdentityProviderClient, ConfirmSignUpCommand} = require('@aws-sdk/client-cognito-identity-provider');



const client = new CognitoIdentityProviderClient({
    region: 'us-east-2', //Specify the AWS region where your Cognito User Pool is located
});
const CLIENT_ID = process.env.CLIENT_ID;

exports.ConfirmSignUp = async (event) => {
    const {fullName, confirmationCode} = JSON.parse(event.body);
    

    const params = {
        ClientId: CLIENT_ID, //Cognito App Client ID
        Username: fullName, //User's email as username
        ConfirmationCode: confirmationCode
    }

    try {
        const command = new ConfirmSignUpCommand(params);
        await client.send(command);

        return {
            statusCode: 200, //HTTP status code for successful request
            body: JSON.stringify({
                message: "User confirmed successfully", //Success message
            }),
        };
        
    } catch (error) {
                return {
            statusCode: 400, //HTTP status code for internal server error
            body: JSON.stringify({
                message: "Confirmation failed", //Error message
                error: error.message, //Include the error message from the exception
            }),
        };
        
    }
}

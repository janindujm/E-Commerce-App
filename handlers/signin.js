const {CognitoIdentityProviderClient, InitiateAuthCommand} = require('@aws-sdk/client-cognito-identity-provider');

//Initialize Cognito client with specified AWS region
const client = new CognitoIdentityProviderClient({
    region: 'us-east-2', //Specify the AWS region where your Cognito User Pool is located
});

const CLIENT_ID = process.env.CLIENT_ID;

exports.signIn = async (event) => {
    //parse the incoming request body to extract user data
    const {email, password} = JSON.parse(event.body);

    //Configure parameters for Cognito SignIn command
    const params = {
        
        ClientId: CLIENT_ID, //Cognito App Client ID
        AuthFlow: 'USER_PASSWORD_AUTH', //Authentication flow type 
        AuthParameters: {
            USERNAME: email, //User's email as username
            PASSWORD: password, //User's password
        },
    };

    try {
        //Create the sign-in command
        const command = new InitiateAuthCommand(params);
        //Execute the sign-in request
        const response = await client.send(command);

        //return client response with success message and tokens
        return {
            statusCode: 200, //HTTP status code for successful request
            body: JSON.stringify({
                message: "User signed in successfully", //Success message
                tokens: response.AuthenticationResult, //Tokens received from Cognito
                //AccessToken, RefreshToken, IdToken
            }),
        };
        
    } catch (error) {
        return {
            statusCode: 400, //HTTP status code for internal server error
            body: JSON.stringify({
                message: "Error signing in user", //Error message
                error: error.message, //Include the error message from the exception
            }),
        };
        
    }
}
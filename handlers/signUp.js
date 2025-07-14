//Import the required AWS Cognito SDK

const {CognitoIdentityProviderClient, SignUpCommand} = require('@aws-sdk/client-cognito-identity-provider');

//Initialize Cognito client with specified AWS region
const client = new CognitoIdentityProviderClient({
    region: 'us-east-2', //Specify the AWS region where your Cognito User Pool is located
});

//define Cognito App Client ID for user pool authentication

const CLIENT_ID = process.env.CLIENT_ID;


//Exported sign-up function to handle new user registration

exports.signUp = async (event) => {
    //parse the incoming request body to extract user data
    const {email,password, fullName} = JSON.parse(event.body);

    //Configure parameters for Cognito Signup command

    const params = {
        ClientId: CLIENT_ID, //Cognito App Client ID
        Username: email, //User's email as username
        Password: password, //User's password
        UserAttributes: [//Additional user attiributes for cognito

            {Name: 'email', Value: email}, //User's email attribute
            {Name: 'name', Value: fullName}, //User's full name attribute
        ]
        
    };

    try {
        //Create the user in cognito user pool
        const command = new SignUpCommand(params);
        //Execute the sign-up request
        await client.send(command);


        //return client response with success message
        return {
            statusCode: 200, //HTTP status code for created resource
            body: JSON.stringify({
                message: "User signed up successfully, Please Verify your email", //Success message
            }),
        };
        
    } catch (error) {
        return {
            statusCode: 400, //HTTP status code for internal server error
            body: JSON.stringify({
                message: "Error signing up user", //Error message
                error: error.message, //Include the error message from the exception
            }),
        };
        
    }
}
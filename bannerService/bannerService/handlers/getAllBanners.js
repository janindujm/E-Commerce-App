
const {DynamoDBClient, ScanCommand} = require('@aws-sdk/client-dynamodb');

const dynamoDbClient = new DynamoDBClient({region: "us-east-2"})

exports.getAllBanners = async () => {
    try {
        const tableName = process.env.DYNAMO_TABLE;
        const scanCommand = new ScanCommand({
            TableName: tableName
        })

        //Excecute the scan command
        const {Items} = await dynamoDbClient.send(scanCommand);

        const banners = Items.map(item => ({
            imageUrl : item.imageUrl.S ,
        }))

        //Retiurn the list of banners
        return{
            statusCode: 200,
            body : JSON.stringify({banners})

        }

        
    } catch (error) {
        return{
            statusCode:500,
            body: JSON.stringify({error:error.message}),
        };
    }

}
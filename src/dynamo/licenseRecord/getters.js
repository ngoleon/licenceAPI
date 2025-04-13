const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const constants = require("../../constants");

// Initialize outside handler to reuse across invocations
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * @param {string} licenseKey
 */
module.exports.getLicenseRecord = async(licenseKey) => {
    try {
        const params = {
            TableName: constants.dynamodbLicenseName,
            Key: { licenseKey }
        };

        console.info("Getting license record", params);
        const data = await docClient.send(new GetCommand(params));
        console.info("Result of getter is:", data);

        return data;
    } catch (err) {
        console.error("Failed to getLicenseRecord:", err);
        return err;
    }
};

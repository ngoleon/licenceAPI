const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamodbUpdateExpression = require("dynamodb-update-expression");
const constants = require("../../constants");
const getters = require("./getters");
const discord = require("../../discord/discordUtils");

// Reuse clients across warm invocations
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Updates the license record in DynamoDB using a dynamic update expression.
 * Only updates the fields provided in `params.data`.
 *
 * @param {Object} params.data - Fields to update in the license record
 * @param {string} params.licenseKey - Unique license key identifier of the user
 * @param {string | number | boolean | {} | []} params.any any additional attributes to add to license.
 * @returns {Promise<Object|null>} The updated license record or null on error
 */
module.exports.updateLicenseData = async(params) => {
    if (params) {
        console.log("Updating license record with params: ", params);
        const original = {
            licenseKey: params.licenseKey
        };

        try {
            const buildExpression = await dynamodbUpdateExpression.getUpdateExpression(original, params.data);
            console.log(buildExpression);

            const updateParams = {
                TableName: constants.dynamodbLicenseName,
                Key: { licenseKey: params.licenseKey },
                ReturnValues: "ALL_NEW",
                UpdateExpression: buildExpression.UpdateExpression,
                ExpressionAttributeNames: buildExpression.ExpressionAttributeNames,
                ExpressionAttributeValues: buildExpression.ExpressionAttributeValues
            };

            console.log("update expression: ", updateParams);
            const updateOutput = await docClient.send(new UpdateCommand(updateParams));
            console.log("update output: ", updateOutput);
            return updateOutput;
        } catch (err) {
            console.error("Update failed: ", err);
            return err;
        }
    }
};

/**
 * Creates a new license key entry using a specified duration in days.
 * Internally delegates to `createKey`.
 *
 * @param {Object} params
 * @param {number} params.period - License duration in days
 * @returns {Promise<Object|null>} License key and metadata or null if failed
 */

module.exports.createLicenseKey = async(params) => {
    console.log(params);

    if (params.period !== undefined) {
        const creationResult = await module.exports.CreateKey(params.period);

        if (creationResult.result === 1) {
            return;
        }

        console.log(`license key generated ${creationResult.key} for customer ${creationResult.customerId}`);
        return {
            licenseKey: creationResult.key,
            customerId: creationResult.customerId
        };
    }
};

/**
 * Adds access to a product for a given license key.
 * Supports instance-based expiry (up to 30 tracked slots).
 *
 * @param {Object} params
 * @param {string} params.licenseKey - Target license key
 * @param {string} params.product - Product identifier (e.g., 'pluginA')
 * @param {number} params.duration - Access duration in days
 * @param {number} params.instances - Number of access instances to grant
 * @param {string} params.userId - Optional user ID to associate
 * @param {string} params.roleId
 * @returns {Promise<Object|string>} Updated license data or error string
 */
module.exports.addProductLicense = async(params) => {
    console.info("Adding a new product: ", params);
    const productEnable = params.product + "Enable";
    const productExpiry = params.product + "Expiry";
    const productInstances = params.product + "Instances";

    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = currentTime + (params.duration * 86400);

    const licenseData = await getters.getLicenseRecord(params.licenseKey);


    if (!licenseData || !licenseData.Item) {
        console.error("MISSING LICENSE KEY DATA WHEN TRYING TO ADD PRODUCT LICENSE KEY");
        return "License record not found";
    }

    const existingExpiries = licenseData.Item[productExpiry] || [];

    // Keep only non-expired instances
    const validExpiries = existingExpiries.filter(e => e.expiryTime > currentTime);
    let expiryInput = [...validExpiries];

    // Add or remove instances
    if (params.instances > 0) {
        const newExpiries = Array(params.instances).fill({ expiryTime });

        if (expiryInput.length + newExpiries.length > 30) {
            console.error(`Too many instances: existing=${expiryInput.length}, requested=${params.instances}`);
            return "FAILED TO ADD LICENSE PRODUCT";
        }

        expiryInput = [...expiryInput, ...newExpiries];
    } else if (params.instances < 0) {
        const removeCount = Math.min(Math.abs(params.instances), expiryInput.length);
        expiryInput = expiryInput.slice(0, expiryInput.length - removeCount);
    }

    const totalInstances = expiryInput.length;

    const input = {
        licenseKey: params.licenseKey,
        data: {
            [productEnable]: true,
            [productExpiry]: expiryInput,
            [productInstances]: totalInstances,
            userId: params.userId
        }
    };

    console.info("Updating license data with params: ", input);
    const licenseProduct = await module.exports.updateLicenseData(input);
    console.info("Final License Product: ", licenseProduct);

    if (params.instances > 0) {
        await discord.updateDiscordRoles({
            userId: params.userId,
            roleId: params.roleId
        });

        await discord.sendDiscordUpdate({
            expiry: expiryTime,
            userId: params.userId,
            licenseKey: params.licenseKey,
            product: params.product
        });
    }

    return licenseProduct;
};

/**
 * @private
 * Generates a unique license key and initializes it with default plugin access.
 * Retries once on collision.
 *
 * @param {number} period - Validity period in days
 * @returns {Promise<Object>} { result: 0 | 1, key?: string, customerId?: number }
 */
module.exports.CreateKey = async(period) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const extendTime = currentTime + (period * 86400);

    console.log("Creating a new License Key");

    const generateKey = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let key = "";
        for (let i = 0; i < 23; i++) {
            if (i === 5 || i === 11 || i === 17) {
                key += "-";
            } else {
                key += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        return key;
    };

    for (let attempt = 0; attempt < 2; attempt++) {
        const license = generateKey();
        const check = await getters.getLicenseRecord(license);

        if (!check.Item) {
            try {
                await module.exports.updateLicenseData({
                    licenseKey: license,
                    data: { demoExpiry: extendTime, demoEnable: false }
                });

                return {
                    result: 0,
                    key: license,
                    customerId: 1
                };
            } catch (err) {
                console.log(err);
                return { result: 1 };
            }
        }
    }

    return { result: 1 };
};

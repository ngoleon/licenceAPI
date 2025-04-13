const axios = require("axios");
const common = require("../common");
const querystring = require("querystring");
const userGetter = require("../dynamo/userRecord/getters");
const licenseGetter = require("../dynamo/licenseRecord/getters");

exports.accessToken = async(event, context) => {
    console.info("event", event);
    const body = JSON.parse(event.body);
    const code = body.code;
    const redirectUri = body.redirectUri;
    try {
        const data = {
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri
        };
        const response = await axios.post("https://discord.com/api/oauth2/token", querystring.stringify(data), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
        console.info("response from getting access token", response);
        const token = response.data.access_token;

        return common.createResponse(200, { token: token });
    } catch (error) {
        console.error("Error exchanging code for token:", error);
        return common.createResponse(400, "Bad Request");
    }
};

module.exports.getCredentials = async(accessToken) => {
    try {
        const idResponse = await axios.get(
            "https://discord.com/api/users/@me",
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        console.info("response from getting id details", idResponse);
        return idResponse.data;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return undefined;
    }
    // return response.data.access_token;
};

exports.licenseInfo = async(event, context) => {
    console.info("License Info Input: ", event);
    const body = JSON.parse(event.body);
    const userInfo = await this.getCredentials(body.token);
    if (userInfo === undefined) {
        return common.createResponse(401, "Unauthorised");
    }
    const userRecord = await userGetter.getUserRecord(userInfo.id);
    console.info(userRecord);
    if (userRecord === undefined || userRecord.Item.licenseKey === undefined) {
        return common.createResponse(404, "Not Found");
    }
    const licenseRecord = await licenseGetter.getLicenseRecord(userRecord.Item.licenseKey);
    console.info(licenseRecord);
    if (licenseRecord === undefined) {
        return common.createResponse(418, "I'm a teapot");
    }

    const returnedData = {
        licenseKey: licenseRecord.Item.licenseKey,
        premiumExpiry: licenseRecord.Item.premiumExpiry,
        zulrahExpiries: licenseRecord.Item.zulrahExpiries,
        lizardExpiries: licenseRecord.Item.lizardExpiries,
        bandosExpiries: licenseRecord.Item.bandosExpiries,
        zamorakExpiries: licenseRecord.Item.zamorakExpiries,
        armadylExpiries: licenseRecord.Item.armadylExpiries,
        saradominExpiries: licenseRecord.Item.saradominExpiries,
        slayerExpiries: licenseRecord.Item.saradominExpiries,
        hwidList: licenseRecord.Item.machineCodes
    };

    return common.createResponse(200, returnedData);
};

exports.userInfo = async(event, context) => {
    console.info("User Info Input: ", event);
    const body = JSON.parse(event.body);
    if(!body.token)
    {
        console.info("No token received");
        return common.createResponse(401, "No token");
    }
    const userInfo = await this.getCredentials(body.token);
    if (userInfo !== undefined) {
        return common.createResponse(200, {
            username: userInfo.username,
            email: userInfo.email
        });
    }
    return common.createResponse(400, "bad request");
};

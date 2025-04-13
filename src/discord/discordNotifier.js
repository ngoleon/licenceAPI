const licenseGetter = require("../dynamo/licenseRecord/getters");
const constants = require("../constants");
const axios = require("axios");
const common = require("../common");

const sendNotification = async(event, context) => {
    const currentTime = Math.floor(new Date().getTime() / 1000); // to seconds
    console.log(event);
    console.log("2", event);
    const body = JSON.parse(event.body);
    if (body.apiKey) {
        const licenseInfo = await licenseGetter.getLicenseRecord(body.apiKey);
        console.log(licenseInfo);
        if (licenseInfo.Item.userId) {
            if (body.title && body.description) {
                const input = {
                    user: licenseInfo.Item.userId,
                    title: body.title,
                    description: body.description
                };
                await sendDiscordDM(input);
                return common.createResponse(200, "Success " + currentTime);
            }
        }
    }
    return common.createResponse(404, "Bad Request");
};

/**
 * @param {Object} event
 * @param {string} event.user userId for discord
 * @param {string} event.title title of message
 * @param {string} event.description text to send
 */
async function sendDiscordDM(event) {
    console.log(event);
    const createDMUrl = `https://discord.com/api/v10/users/@me/channels`;
    const body = `{"recipient_id": ${event.user}}`;
    const response = await axios.post(createDMUrl, body, {
        headers: {
            "Authorization": `Bot ${constants.shismoToken}`,
            "Content-Type": "application/json",
            "Accept-Encoding": "gzip,deflate,compress"
        }
    });
    console.log(response.data.id);

    const createMessageUrl = `https://discord.com/api/v10//channels/${response.data.id}/messages`;
    const embed = [
        {
            title: event.title,
            description: event.description,
            thumbnail: {
                url: "http://shismoplugins.com/resources/cropped-shismo.png"
            },
            color: 8311585
        }
    ];

    const body2 = { "embeds": embed };
    try {
        const response2 = await axios.post(createMessageUrl, body2, {
            headers: {
                "Authorization": `Bot ${constants.shismoToken}`,
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip,deflate,compress"
            }
        });
        console.log(response2);
    } catch (error) {
        console.log(error);
    }
}

module.exports = { sendDiscordDM, sendNotification };

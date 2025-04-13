const constants = require("../constants");
const axios = require("axios");
const discordNotify = require("./discordNotifier");

/**
 * @param {Object} params
 * @param {string} params.roleId Discord Role ID
 * @param {string} params.userId Discord User ID
 */
module.exports.updateDiscordRoles = async(params) => {
    console.log("updating discord roles ", params);
    const assignRoleUrl = `https://discord.com/api/v10/guilds/${constants.demoGuildId}/members/${params.userId}/roles/${params.roleId}`;
    const headers = {
        "Authorization": `Bot ${constants.demoToken}`,
        "Accept-Encoding": "gzip,deflate,compress"
    };
    const article = {};
    const response3 = await axios.put(assignRoleUrl, article, { headers });
    if (response3.status !== 204) {
        await this.sendApiLogMessage("Roles", `Failed to apply role ${params.roleId} to user <@${params.userId}>`);
    }
    console.log(response3);
};

/**
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.title
 * @param {string} params.description
 */
module.exports.sendDiscordDM = async(params) => {
    await discordNotify.sendDiscordDM(params);
};

/**
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.expiry
 * @param {string} params.licenseKey
 * @param {string} params.product
 */
module.exports.sendDiscordUpdate = async(params) => {
    console.log("Sending Discord Message: ", params);
    const timeRemainString = await this.unixTimeConversion(params.expiry);
    const createDMUrl = `https://discord.com/api/v10/users/@me/channels`;
    const body = `{"recipient_id": ${params.userId}}`;
    const response = await axios.post(createDMUrl, body, {
        headers: {
            "Authorization": `Bot ${constants.demoToken}`,
            "Content-Type": "application/json",
            "Accept-Encoding": "gzip,deflate,compress"
        }
    });
    console.log(response.data.id);

    const createMessageUrl = `https://discord.com/api/v10//channels/${response.data.id}/messages`;
    const embed = [
        {
            title: "License Key",
            description: `Thank you for your purchase <@${params.userId}>!\n\nYour License Key is: ||${params.licenseKey}||. And is valid for ${timeRemainString}. \n\nThe ${params.product} role has been added to your account!`,
            color: 8311585
        },
        {
            title: "Terms & Conditions",
            description: `Should you require support, post a message in <#1360982889986129961>.`,
            color: 8311585
        }
    ];

    const body2 = { "embeds": embed };
    try {
        const response2 = await axios.post(createMessageUrl, body2, {
            headers: {
                "Authorization": `Bot ${constants.demoToken}`,
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip,deflate,compress"
            }
        });
        console.log(response2);
    } catch (error) {
        console.log(error);
    }
};

module.exports.unixTimeConversion = async(time) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const difference = time - currentTime;

    const countDownSeconds = new Date();
    countDownSeconds.setSeconds(countDownSeconds.getSeconds() + difference);
    const now = new Date().getTime();
    const remainingSeconds = countDownSeconds - now;

    const days = Math.floor(remainingSeconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingSeconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingSeconds % (1000 * 60 * 60)) / (1000 * 60));

    let response = days + " days, " + hours + " hours, " + minutes + " minutes";

    if (remainingSeconds < 0) {
        response = "0 Days 0 Hours 0 Minutes";
    }

    return response;
};

module.exports.sendApiLogMessage = async(type, message) => {
    try {
        const messageUrl = `https://discord.com/api/v10/channels/1308377383912607774/messages`;
        const body = {
            "embeds": [
                {
                    title: type,
                    description: message
                }
            ]
        };
        const response = await axios.post(messageUrl, body, {
            headers: {
                "Authorization": `Bot ${constants.demoToken}`,
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip,deflate,compress"
            }
        });
        console.info("Response to debug post: ", response);
    } catch (err) {
        console.info("Failed to send apilog message: ", err);
    }
};

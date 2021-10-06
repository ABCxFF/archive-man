let config;
try {
    config = require("./conf.json");

    if (typeof config.token !== "string") throw 1;
    if (typeof config.owner !== "string" && !Array.isArray(config.owners)) throw 1;
    if (typeof config.prefix !== "string") throw 1;
} catch {
    console.log(`INVALID CONFIGURATION FILE

Bot requires:
    config.token: string - The bot account's token
    config.prefix: string - The prefix for usage on discord
    
    and config.owner OR config.owners
    config.owner: string - The id of the user that can use the bot
    config.owners: string[] - A list of account ids that can use the bot`);

    process.exit(1);
}

const fs = require("fs");
const fetch = require("node-fetch")
const { Client, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
});

const channelRegex = /<#(\d+)>/
const mentionRegex = /<@(\d+)>/

if (!fs.existsSync("./downloads/")) fs.mkdirSync("./downloads/")

client.once('ready', () => {
	console.log('Ready!');

    client.on("messageCreate", async (message) => {
        if (config.owner !== message.author.id && !(Array.isArray(config.owners) && config.owners.includes(message.author.id))) return;

        if (!message.content.startsWith(`${config.prefix}archive `)) return;

        const args = message.content.split(" ").slice(1);

        await message.guild.channels.fetch(undefined, {
            cache: true
        })

        const ignores = args.filter(r => r.startsWith("--ignore=")).map(r => r.split('=')[1]);
        const threads = args.findIndex(r => r === "--no-threads") === -1;
        const uploadFiles = args.findIndex(r => r === "--upload") !== -1;
        const archiveMembers = args.findIndex(r => r === "--archive-members") !== -1;
        const storeFiles = args.findIndex(r => r === "--no-store") === -1;
        const chunkDelay = parseInt((args.find(r => r === "--chunk-delay") || "--chunk-delay=500").split("=")[1]);

        let channels;

        if (args.includes('all')) channels = Array.from(message.guild.channels.cache).map($ => $[1])
        else {
            const channelIds = args.filter(txt => channelRegex.test(txt)).map(txt => channelRegex.exec(txt)[1]);

            channels = channelIds.map(id => message.guild.channels.cache.get(id));
        }
        
        channels = channels.filter(c => !ignores.includes(c.id));
        channels = channels.filter(channel => channel.isText() && (threads || !channel.isThread()));

        const downloads = [];

        const dirPath = "./downloads/" + message.channel.guild.id + "/";

        if (storeFiles) {
            if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true });
            fs.mkdirSync(dirPath);
            fs.mkdirSync(dirPath + "attachments/");
        }

        let attachmentCount = 0;
        let attachmentSize = 0;

        await Promise.all(channels.map(async (channel) => {
            const statusMessage = await message.channel.send(`Archiving <#${channel.id}>...`);

            let messageCount = 0;
            let outputText = "";

            let messages;
            let lastMessage = message.id;

            let cycle = 0;

            do {
                // [id, Discord.Message][]
                messages = Array.from(await channel.messages.fetch({
                    before: lastMessage,
                    limit: 100
                }));
                
                cycle += 1;
                console.log("Archiving #" + channel.name + ": Cycling " + cycle)

                outputText = (await Promise.all(messages.map(async (param, i, l) => {
                    // I did a bit of inlining...

                    const message = l[l.length - i - 1][1]; // reverse order

                    if (!message.content && message.attachments.size === 0) return `${message.author.tag} <@${message.author.id}> - ${dateFormatter.format(message.createdTimestamp)}${message.editedTimestamp ? " (editted)" : ""}: (No Content. Message ID: ${message.id})`;
                
                    const attachmentText = message.attachments.size === 0 ? "" : ("\n\n" + (await Promise.all(Array.from(message.attachments).map(async ([id, attachment]) => {
                        if (storeFiles) {
                            try {

                                const buffer = Buffer.from(await fetch(attachment.url.startsWith("https://cdn.discordapp.com/attachments") ? attachment.url : attachment.proxyURL).then(r => r.arrayBuffer()));
                                
                                fs.writeFileSync("./downloads/" + channel.guild.id + "/attachments/" + attachmentCount + "." + attachment.name, buffer);

                                attachmentSize += buffer.byteLength;
                                attachmentCount += 1;

                                return `<${id} attachments/${attachmentCount - 1}.${attachment.name}>`
                            } catch (err) {
                                console.log(`Error during attachment ${attachment.id} download\n\n${err}`);

                                return `<${attachment.id} error during download>`
                                
                            }
                        } else return `<${attachment.id}, ${attachment.url}>`;
                    }))).join("\n"))
                    return `${message.author.tag} <@${message.author.id}> - ${dateFormatter.format(message.createdTimestamp)}${message.editedTimestamp ? " (editted)" : ""}
${message.id}: ${message.content.replace(channelRegex, (_, id) => {
                        const kChannel = channel.guild.channels.cache.get(id);

                        if (!kChannel) return _;

                        return "#" + kChannel.name
                    }).replace(mentionRegex, (_, id) => {
                        const member = channel.guild.members.cache.get(id);

                        if (!member) return _;

                        return "@" + member.user.tag
                    })}${attachmentText}`;
                }))).join("\n\n") + "\n\n" + outputText;

                messageCount += messages.length

                if (messages.length === 0) break;

                lastMessage = messages[messages.length - 1][0];

                await new Promise(r => setTimeout(r, chunkDelay));
            } while (messages.length === 100);

            downloads.push({
                name: channel.name + `${channel.isThread() ? ".thread" : ""}.txt`,
                attachment: Buffer.from(`${channel.guild.name}#${channel.name} ARCHIVES (${messageCount} messages)\n\n` + outputText)
            });

            statusMessage.edit("Done Archiving <#" + channel.id + ">")
        }));

        if (archiveMembers) {
            let memberText = `${message.guild.name} Member List\n\n`;

            await message.guild.members.fetch({limit: 500}).then(members => {
                Array.from(members).sort((m1, m2) => m1[1].joinedAt - m2[1].joinedAt).forEach(([_, member]) => {
                    memberText += member.displayName + ` (${member.user.tag}) <@${member.user.id}>:
    Roles: ${Array.from(member.roles.cache).map(([_, r]) => r.name).join(", ")}
    Avatar: ${member.user.displayAvatarURL()}
    Join Date: ${member.joinedAt}\n\n`
                });
            });

            downloads.push({
                name: "_members.txt",
                attachment: Buffer.from(memberText)
            });
        }

        if (storeFiles) {
            for (const download of downloads) fs.writeFileSync(dirPath + download.name, download.attachment)
        }

        console.log("Complete! " + downloads.length + " files written (" + downloads.reduce((a, f) => a + f.attachment.byteLength, 0) + " bytes)")

        message.channel.send({
            reply: {
                failIfNotExists: false,
                messageReference: message
            },
            content: "Complete! " + downloads.length + " files written (" + (attachmentSize + downloads.reduce((a, f) => a + f.attachment.byteLength, 0)) + " bytes)"
        });

        try {
            if (!uploadFiles) return;

            for (let i = 0; i < downloads.length; i += 10) {
                message.channel.send({
                    files: downloads.slice(i, i + 10)
                })
            }
        } catch(err) {
            message.channel.send("Error during upload. Check console");

            console.error("Upload error", err)
        }
    });
});


client.login(config.token);


process.on("uncaughtException", (err) => {
    console.log(err)
})

process.on("uncaughtRejection", (err) => {
    console.log(err)
});

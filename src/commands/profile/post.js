const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const userSchema = require('../../Schemas/profile');
const postSchema = require('../../Schemas/posts');
const { randomCode } = require("../../util/randomCode")

module.exports = {
    data: new SlashCommandBuilder()
    .setName('post')
    .setDescription('post commands')
    .addSubcommand(sub => sub
        .setName('view')
        .setDescription('View a user\'s posts')
        .addUserOption(opt => opt.setName(`user`).setDescription(`The user you want to see their profile.`).setRequired(false))
        .addStringOption(opt => opt.setName(`identifier`).setDescription(`The media id of the user's profile`).setRequired(false))
    )
    .addSubcommand(sub => sub
        .setName('publish')
        .setDescription('Publish a post')
    )
    .addSubcommand(sub => sub
        .setName('delete')
        .setDescription('Delete one of your posts')
        .addStringOption(opt => opt.setName('media_id').setDescription('The id of the post you want to delete (Warning: this cannot be undone)').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('favorites')
        .setDescription('View your favorite posts.')
    )
    .addSubcommand(sub => sub
        .setName('recent')
        .setDescription('View the most recent posts.')
    ),

    async execute (interaction, client) {
        const { options } = interaction;
        const sub = options.getSubcommand();

        // - /post view
        if (sub == 'view') {
            await interaction.deferReply({ ephemeral: true })


            let data = await userSchema.findOne({ userId: interaction.user.id });

            const id = options.getString('identifier');
            let user = options.getUser('user');

            const userdata = await userSchema.findOne({ userId: interaction.user.id }); // to check if a user is staff

            //checks data
            if (id && !user) {
                data = await userSchema.findOne({ mediaId: id })
                if (!data) return await interaction.reply({ content: "I could not find an account associated with this media Id.", ephemeral: true })

                user = client.users.cache.get(data.userId);
                if (!user) return await interaction.reply({ content: "I could not find an account associated with this media Id.", ephemeral: true })
            } else if (user && !id) {
                data = await userSchema.findOne({ userId: user.id })
            } else if (!id && !user) {
                user = interaction.user;
                data = await userSchema.findOne({ userId: interaction.user.id })
            } else if (id && user) {
                user = interaction.options.getUser('user')
                data = await userSchema.findOne({ userId: user.id })
            }

            //data = schema    
            //user = user chosen || interaction user
            if (!data) return await interaction.editReply({ content: "It seems this user doesn't have an account..."})

            if (data.accountInfo.privateAcc && userdata?.accountInfo?.staff?.role == "None" && interaction.user.id !== data.userId) {
                return await interaction.editReply({ content: "This user's posts are private." })
            }

            const posts = await postSchema.find({ ownerId: user.id }).sort({ postedAt: -1 });
            if (posts.length == 0) return await interaction.editReply({ content: "This user has no posts published yet." }) 
            let pages = [];

            posts.forEach(post => {
                const text = post.text;
                const id = post.postIdentifier
                const owner = client.users.cache.get(post.ownerId) || user;

                const embed = new EmbedBuilder()
                .setColor('Blurple')
                .setTimestamp()
                .setAuthor({ name: `${owner.username} (${data.mediaId})`, iconURL: owner.displayAvatarURL({ dynamic: true }) })
                .setDescription(`**Likes:** **\`${post.likes}\`** | **Favorites:** **\`${post.favorites}\`**\n\n${text}\n\n- <t:${~~(post.postedAt/1000)}:R>`)
                .setFooter({ text: id })

                pages.push(embed);
            })

            await slashPaginate({
                interaction: interaction,
                pages: pages,

                disable: {
                    first_last: true,
                    placeholder: true
                }
            })
        }


        // - /post publish
        else if (sub == 'publish') {
            const modal = new ModalBuilder()
            .setCustomId('modal_submitpost')
            .setTitle('Post Description')
            
            const txt = new TextInputBuilder()
            .setRequired(true)
            .setLabel('Text')
            .setMaxLength(1500)
            .setPlaceholder("Look what I did today...")
            .setStyle(TextInputStyle.Paragraph)
            .setCustomId('txt_submitpost')
            const txtact = new ActionRowBuilder().setComponents(txt)
            modal.setComponents(txtact)

            await interaction.showModal(modal);
        }

        // - /post delete
        else if (sub == 'delete') {
            await interaction.deferReply({ ephemeral: true })
            const id = options.getString('media_id');

            const post = await postSchema.findOneAndDelete({ postIdentifier: id, ownerId: interaction.user.id })

            if (!post) await interaction.editReply({ content: "I couldn't find a post with that media Id..." })
            else {
                await interaction.editReply({ content: `Post "${post.postIdentifier}" deleted.`})
            }
        }

        // - /post favorites
        else if (sub == 'favorites') {
            await interaction.deferReply({ ephemeral: true })

            const data = await userSchema.findOne({ userId: interaction.user.id });
            if (data.favorites.length <= 0) return await interaction.editReply({ content: "You don't have any favorite posts."})

            let pages = [];

            for (id of data.favorites) {
                const post = await postSchema.findOne({ postIdentifier: id })
                const embed = new EmbedBuilder()
                .setColor('Blurple')

                if (!post) {
                    embed.setTitle('Deleted Post.').setTimestamp()
                    pages.push(embed)
                    continue;
                } else {
                    const text = post.text;
                    const id = post.postIdentifier
                    const owner = client.users.cache.get(post.ownerId)
                    const data2 = await userSchema.findOne({ userId: owner?.id })

                    embed
                    .setColor('Blurple')
                    .setTimestamp()
                    .setAuthor({ name: `${owner?.username ?? "???"} (${data2.mediaId ?? "???"})`, iconURL: owner?.displayAvatarURL({ dynamic: true }) ?? undefined })
                    .setDescription(`**Likes:** **\`${post.likes}\`** | **Favorites:** **\`${post.favorites}\`**\n\n${text}\n\n- <t:${~~(post.postedAt/1000)}:R>`)
                    .setFooter({ text: id })

                    pages.push(embed)
                }
            }
            await slashPaginate({
                interaction: interaction,
                pages: pages,

                disable: {
                    first_last: true,
                    placeholder: true
                }
            })
        } 

        // - /post recent
        else if (sub == 'recent') {
            await interaction.deferReply({ ephemeral: true })

            let pages = [];

            const data = await postSchema.find().sort({ postedAt: -1 });
            if (data.length <= 0) return await interaction.editReply({ content: "There are no recent posts."});

            for (i in data) {
                const post = data.at(i)
                const text = post.text;
                    const id = post.postIdentifier
                    const owner = client.users.cache.get(post.ownerId)
                    const data2 = await userSchema.findOne({ userId: owner?.id })

                    const embed = new EmbedBuilder()
                    .setColor('Blurple')
                    .setTimestamp()
                    .setAuthor({ name: `${owner?.username ?? "???"} (${data2.mediaId ?? "???"})`, iconURL: owner?.displayAvatarURL({ dynamic: true }) ?? undefined })
                    .setDescription(`**Likes:** **\`${post.likes}\`** | **Favorites:** **\`${post.favorites}\`**\n\n${text}\n\n- <t:${~~(post.postedAt/1000)}:R>`)
                    .setFooter({ text: id })

                    pages.push(embed)
            }

            await slashPaginate({
                interaction: interaction,
                pages: pages,

                disable: {
                    first_last: true,
                    placeholder: true
                }
            })
        }
    }
}

















































// pagination (from embed-pagination.js)
async function slashPaginate(options = {}) {
    try {
        if (!options.ephemeral) options.ephemeral = false;
        if(!options.interaction) throw new TypeError('Provide an interaction argument')
        if(!options.pages) throw new TypeError('Provide a page argument')
        if(!Array.isArray(options.pages)) throw new TypeError('Pages must be an array')
        if(!options.emojis) options.emojis = {};
        
        if(!options.emojis.beginning) options.emojis.beginning = "⏪";
        if(!options.emojis.left) options.emojis.left = "◀️";
        if(!options.emojis.none) options.emojis.none = "⏹️";
        if(!options.emojis.right) options.emojis.right = "▶️";
        if(!options.emojis.end) options.emojis.end = "⏩";
    
        if(!Array.isArray(options.pages)) throw new TypeError('Pages must be an array')

        if (!options.disable) options.disable = {};
        if (!options.disable.first_last) options.disable.first_last = false;
        if (!options.disable.placeholder) options.disable.placeholder = false;
    
        if(!options.buttonstyles) options.buttonstyles = {};
        if(!options.buttonstyles.beginning) options.buttonstyles.beginning = "Primary";
        if(!options.buttonstyles.left) options.buttonstyles.left = "Primary";
        if(!options.buttonstyles.none) options.buttonstyles.none = "Secondary";
        if(!options.buttonstyles.right) options.buttonstyles.right = "Primary";
        if(!options.buttonstyles.end) options.buttonstyles.end = "Primary";
    
        if (typeof options.ephemeral !== "boolean") throw new TypeError("Ephemeral needs to be in a boolean format")
    
        if(typeof options.emojis.beginning !== 'string') throw new TypeError('Emojis need to be in a string format');
        if(typeof options.emojis.left !== 'string') throw new TypeError('Emojis need to be in a string format');
        if(typeof options.emojis.none !== 'string') throw new TypeError('Emojis need to be in a string format');
        if(typeof options.emojis.right !== 'string') throw new TypeError('Emojis need to be in a string format');
        if(typeof options.emojis.end !== 'string') throw new TypeError('Emojis need to be in a string format');
    
        if(options.buttonstyles.left === 'Primary') options.buttonstyles.beginning = ButtonStyle.Primary
        else if(options.buttonstyles.left === 'Secondary') options.buttonstyles.beginning = ButtonStyle.Secondary
        else if(options.buttonstyles.left === 'Danger') options.buttonstyles.beginning = ButtonStyle.Danger
        else if(options.buttonstyles.left === 'Success') options.buttonstyles.beginning = ButtonStyle.Success
        else if(options.buttonstyles.left === 'Link') throw new TypeError('Button style cannot be "Link"')
        else throw new TypeError('Give a valid ButtonStyle')
    
        if(options.buttonstyles.none === 'Primary') options.buttonstyles.none = ButtonStyle.Primary
        else if(options.buttonstyles.none === 'Secondary') options.buttonstyles.beginning = ButtonStyle.Secondary
        else if(options.buttonstyles.none === 'Danger') options.buttonstyles.beginning = ButtonStyle.Danger
        else if(options.buttonstyles.none === 'Success') options.buttonstyles.beginning = ButtonStyle.Success
        else if(options.buttonstyles.none === 'Link') throw new TypeError('Button style cannot be "Link"')
        else throw new TypeError('Give a valid ButtonStyle')
    
        if(options.buttonstyles.right === 'Primary') options.buttonstyles.beginning = ButtonStyle.Primary
        else if(options.buttonstyles.right === 'Secondary') options.buttonstyles.beginning = ButtonStyle.Secondary
        else if(options.buttonstyles.right === 'Danger') options.buttonstyles.beginning = ButtonStyle.Danger
        else if(options.buttonstyles.right === 'Success') options.buttonstyles.beginning = ButtonStyle.Success
        else if(options.buttonstyles.right === 'Link') throw new TypeError('Button style cannot be "Link"')
        else throw new TypeError('Give a valid ButtonStyle')
    
        if(options.buttonstyles.end === 'Primary') options.buttonstyles.beginning = ButtonStyle.Primary
        else if(options.buttonstyles.end === 'Secondary') options.buttonstyles.beginning = ButtonStyle.Secondary
        else if(options.buttonstyles.end === 'Danger') options.buttonstyles.beginning = ButtonStyle.Danger
        else if(options.buttonstyles.end === 'Success') options.buttonstyles.beginning = ButtonStyle.Success
        else if(options.buttonstyles.end === 'Link') throw new TypeError('Button style cannot be "Link"')
        else throw new TypeError('Give a valid ButtonStyle')
    
        const beginning = new ButtonBuilder()
        .setCustomId('beginning')
        .setEmoji(options.emojis.beginning)
        .setStyle(options.buttonstyles.beginning)
        .setDisabled(true)
    
        const prev = new ButtonBuilder()
        .setCustomId('prev')
        .setEmoji(options.emojis.left)
        .setStyle(options.buttonstyles.left)
        .setDisabled(true)
    
        const none = new ButtonBuilder()
        .setCustomId('none')
        .setEmoji(options.emojis.none)
        .setStyle(options.buttonstyles.none)
        .setDisabled(true)

        const like = new ButtonBuilder()
        .setCustomId('like')
        .setEmoji('❤️')
        .setStyle(ButtonStyle.Secondary)

        const favorite = new ButtonBuilder()
        .setCustomId('favorite')
        .setEmoji('⭐')
        .setStyle(ButtonStyle.Secondary)
    
        const next = new ButtonBuilder()
        .setCustomId('next')
        .setEmoji(options.emojis.right)
        .setStyle(options.buttonstyles.right)
    
        const end = new ButtonBuilder()
        .setCustomId('end')
        .setEmoji(options.emojis.end)
        .setStyle(options.buttonstyles.end)
    
        let buttonRow = new ActionRowBuilder().setComponents(prev, like, favorite, next)
        let singular = new ActionRowBuilder().setComponents(like, favorite);
        let index = 0;
    
        if (typeof options.pages[0] == 'object') {
            const obj = options.pages[index]
            if (!obj.data) {
            const embed = new EmbedBuilder()
            if (obj.color) embed.setColor(obj.color)
            if (obj.title) embed.setTitle(obj.title)
            if (obj.description) embed.setDescription(obj.description)
            if (obj.author)
            if (obj.fields) {
                if (obj.fields.length > 25) throw new Error("Embed cannot have more fields than 25")
                for (let field of obj.fields) {
                    if (field.value && !field.name || field.name && !field.value) throw new Error("Embed needs to have both field params filled out")
                    embed.addFields(
                        { name: field.name, value: field.value }
                    )}}
            if (obj.footer) {
                if (!obj.footer.text) throw new Error("Embed footer requires text param")
                if (obj.footer.icon_url) embed.setFooter({ text: obj.footer.text, icon_url: obj.footer.icon_url });
                else embed.setFooter({ text: obj.footer.text })
            }
            if (obj.author) {
                if (!obj.author.name) throw new Error("Embed author requires name param")
                if (obj.footer.icon_url) embed.setAuthor({ name: obj.author.name, iconURL: obj.author.icon_url})
                else embed.setAuthor({ name: obj.author.name })
            }
            if (obj.thumbnail) {
                    embed.setThumbnail(obj.thumbnail)
            }
            if (obj.image) {
                embed.setImage(obj.image)
            }
            if (obj.timestamp) {
                if (obj.timestamp == true) embed.setTimestamp();
            }
            options.pages[index] = embed;
            }
        }
        let currentPage;

        if (options.pages.length <= 1) {
            currentPage = await options.interaction.editReply({
             embeds: options.pages,
             components: [singular],
             fetchReply: true,
             ephemeral: options.ephemeral
            })
         }
        else {
            currentPage = await options.interaction.editReply({
                embeds: [options.pages[index]],
                components: [buttonRow],
                fetchReply: true,
                ephemeral: options.ephemeral
            })
        }   

        const collector = await currentPage.createMessageComponentCollector({
            componentType: ComponentType.Button,
        })
    
        collector.on('collect', async (i) => {
            if (i.user.id !== options.interaction.user.id) return await i.reply({ content: 'You can\'t use these buttons', ephemeral: true})
    
            if(i.customId == 'prev') {
                if(index > 0) index--;
            } else if(i.customId == 'next') {
                if (index < options.pages.length - 1) index++;
            } else if(i.customId == 'beginning') {
                index = 0;
            } else if(i.customId == 'end') {
                index = options.pages.length - 1;
            } else if (i.customId == 'like') {
                const id = options.pages[index].data.footer.text

                const user = await userSchema.findOne({ userId: i.user.id })
                if (!user) {
                    await i.reply({ content: "It seems you don't have an account..", ephemeral: true })
                } else {

                if (user.likes.includes(id)) {
                    await postSchema.updateOne({ postIdentifier: id }, { $inc: { likes: -1 }})
                    await userSchema.updateOne({ userId: i.user.id }, { $pull: { likes: id}})

                    await i.reply({ content: `Post unliked. (${id})`, ephemeral: true });
                } else {
                    await postSchema.updateOne({ postIdentifier: id }, { $inc: { likes: 1 }})
                    await userSchema.updateOne({ userId: i.user.id }, { $push: { likes: id}})
                    await i.reply({ content: `Post liked! (${id})`, ephemeral: true });
                }
            }
            } else if (i.customId == 'favorite') {
                const id = options.pages[index].data.footer.text;

                const user = await userSchema.findOne({ userId: i.user.id })
                if (!user) {
                    await i.reply({ content: "It seems you don't have an account..", ephemeral: true })
                } else {
                if (user.favorites.includes(id)) {
                    await postSchema.updateOne({ postIdentifier: id }, { $inc: { favorites: -1 }})
                    await userSchema.updateOne({ userId: i.user.id }, { $pull: { favorites: id}})

                    await i.reply({ content: `Post unfavorited. (${id})`, ephemeral: true });
                } else {
                    await postSchema.updateOne({ postIdentifier: id }, { $inc: { favorites: 1 }})
                    await userSchema.updateOne({ userId: i.user.id }, { $push: { favorites: id }})
                    await i.reply({ content: `Post favorited! (${id})`, ephemeral: true });
                }
            }
            }
    
            if (index == 0) prev.setDisabled(true)
            else prev.setDisabled(false)
    
            if (index == 0) beginning.setDisabled(true)
            else beginning.setDisabled(false)
    
            if (index == options.pages.length - 1) next.setDisabled(true)
            else next.setDisabled(false)
    
            if (index == options.pages.length - 1) end.setDisabled(true)
            else end.setDisabled(false)
    
            if (typeof options.pages[index] == 'object') {
                const obj = options.pages[index]
                    if (!obj.data){
                        const embed = new EmbedBuilder()
                        if (obj.color) embed.setColor(obj.color)
                        if (obj.title) embed.setTitle(obj.title)
                        if (obj.description) embed.setDescription(obj.description)
                        if (obj.fields) {
                            if (obj.fields.length > 25) throw new Error("Embed cannot have more fields than 25")
                            for (let field of obj.fields) {
                                if (field.value && !field.name || field.name && !field.value) throw new Error("Embed needs to have both field params filled out")
                                embed.addFields(
                                    { name: field.name, value: field.value }
                                )}}
                        if (obj.footer) {
                            if (!obj.footer.text) throw new Error("Embed footer requires text param")
                            if (obj.footer.icon_url) embed.setFooter({ text: obj.footer.text, icon_url: obj.footer.icon_url });
                            else embed.setFooter({ text: obj.footer.text })
                        }
                        if (obj.author) {
                            if (!obj.author.name) throw new Error("Embed author requires name param")
                            if (obj.footer.icon_url) embed.setAuthor({ name: obj.author.name, iconURL: obj.author.icon_url})
                            else embed.setAuthor({ name: obj.author.name })
                        }
                        if (obj.thumbnail) {
                                embed.setThumbnail(obj.thumbnail)
                        }
                        if (obj.image) {
                            embed.setImage(obj.image)
                        }
                        if (obj.timestamp) {
                            if (obj.timestamp == true) embed.setTimestamp();
                        }
                        options.pages[index] = embed;
                    }   
            }
    
            if (!['favorite', 'like'].includes(i.customId)) {
                await i.update({
                    embeds: [options.pages[index]],
                    components: [buttonRow],
                })
            }
        })
    } catch (err) {
        console.log(err)
        return await options.interaction.editReply({ content: "There was an error executing this command", ephemeral: true })
    }
}
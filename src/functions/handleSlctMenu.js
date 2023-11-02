const fs = require('fs');

module.exports = (client) => {
    let allMenus = fs.readdirSync('./src/aSelect_menu')
    for(const folder of allMenus) {
        if (!fs.lstatSync(`./src/aSelect_menu/${folder}`).isDirectory()) continue;
        const menuFiles = fs.readdirSync(`./src/aSelect_menu/${folder}`).filter(f => f.endsWith('.js'));
        for (file of menuFiles) {
            const menu = require(`../aSelect_menu/${folder}/${file}`);
            client.Menus.set(menu.customId, menu)
        }
    }
}
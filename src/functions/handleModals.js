const fs = require('fs');

module.exports = (client) => {
    let allmodals = fs.readdirSync('./src/dModals')
    for(const folder of allmodals) {
        if (!fs.lstatSync(`./src/dModals/${folder}`).isDirectory()) continue;
        const modalFiles = fs.readdirSync(`./src/dModals/${folder}`).filter(f => f.endsWith('.js'));
        for (file of modalFiles) {
            const modal = require(`../dModals/${folder}/${file}`);
            client.Modals.set(modal.customId, modal)
        }
    }
}
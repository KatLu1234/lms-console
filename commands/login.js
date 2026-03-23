const keytar = require('keytar');

module.exports = {
    "name": "login",
    "help": "usage: login",
    async execute(lms, args) {

        const username = await keytar.getPassword('lms-console', "username");
        const password = await keytar.getPassword('lms-console', "password");

        try {
            await lms.login(username, password);
        } catch (error) {
            console.log("[ERROR] " + error.message);
        }
    }
}
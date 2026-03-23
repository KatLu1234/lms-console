const keytar = require('keytar');
const readlineSync = require('readline-sync');


module.exports = {
    name: "setinfo",
    help: "usage: setinfo",
    async execute(lms, args) {
        
        const username = readlineSync.question('username: ');
        const password = readlineSync.question('password: ', { hideEchoBack: true, mask: '*'});
        const passwordConfirm = readlineSync.question('password confirm: ', { hideEchoBack: true, mask: '*'});

        await keytar.setPassword('lms-console', "username", username);
        await keytar.setPassword('lms-console', "password", password);
        
        console.log(`[LOG] ${key} 설정을 완료하였습니다.`);
    }
}
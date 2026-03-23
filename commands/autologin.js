
module.exports = {
    name: "autologin",
    help: "usage: autologin",
    async execute(lms, args) {
     
        const autologinConfig = lms.config.get("autologin") || false;
        lms.config.set("autologin", !autologinConfig);
        console.log(`[LOG] 자동 로그인이 ${!autologinConfig ? "활성" : "해제"}되었습니다.`);
    }
}
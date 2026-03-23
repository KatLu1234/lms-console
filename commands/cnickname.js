

module.exports = {
    name: "cnickname",
    help: "usage : \n cnickname set [이름] [강의 id] \n cnickname get",
    async execute(lms, args) {
        try {
            const [subcmd, ...subargs] = args;

            if (subcmd == "set") {
                const [name, id ] = subargs;
                if (!name || !id) {
                    console.log("[ERROR] 사용법 : cnickname set [이름] [강의 id]");
                    return;
                }
                const nicknameList = lms.config.get("nicknameList") || [];
                nicknameList.push({ name , id });
                lms.config.set("nicknameList", nicknameList);
            }
            else if (subcmd == "get" || !subcmd) {
                const nicknameList = lms.config.get("nicknameList") || [];
                console.table(nicknameList);
            }
            else {
                console.log("[LOG] 커맨드 없음.");
            }
        } catch (error) {
            console.log("[ERROR] " + error.message);
        }
    }
}
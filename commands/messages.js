
const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const i = String(date.getMinutes()).padStart(2, '0');
    return `${m}/${d} ${h}:${i}`;
};

module.exports = {
    name: "messages",
    help: "usage : messages [unread]",
    async execute(lms, args) {
        if (!lms.isLoggedIn()) {
            console.log("\x1b[31m[ERROR] 로그인이 필요합니다.\x1b[0m");
            return;
        }
        try {   
            const showUnreadOnly = args.includes("unread");
            const scope = showUnreadOnly ? "scope=unread&" : "";
            const url = `https://mylms.korea.ac.kr/api/v1/conversations?${scope}filter_mode=and&include_private_conversation_enrollments=false&per_page=20`;
            
            console.log(`\x1b[1m\x1b[36m\n=== ${showUnreadOnly ? "읽지 않은 " : ""}메시지 함 ===\x1b[0m`);
            
            const response = await lms.client.get(url);
            const messages = response.data;

            if (!messages || messages.length === 0) {
                console.log("\n 메시지가 없습니다.");
            } else {
                messages.forEach(msg => {
                    const isUnread = msg.workflow_state === "unread";
                    const statusIcon = isUnread ? "\x1b[31m🔴\x1b[0m" : "⚪";
                    const date = formatDate(msg.last_message_at);
                    const context = msg.context_name || "알 수 없는 과목";
                    
                    // 제목과 내용 요약 (너무 길면 자르기)
                    const subject = msg.subject.length > 50 ? msg.subject.substring(0, 47) + "..." : msg.subject;
                    const snippet = msg.last_message.replace(/\r?\n|\r/g, " ").substring(0, 60);

                    console.log(`\n${statusIcon} \x1b[1m\x1b[33m[${context}]\x1b[0m \x1b[90m(${date})\x1b[0m`);
                    console.log(`   \x1b[1m제목:\x1b[0m ${subject}`);
                    console.log(`   \x1b[90m내용: ${snippet}...\x1b[0m`);
                });
            }
            
            console.log("\n\x1b[36m" + "─".repeat(70) + "\x1b[0m\n");

        } catch (e) {
            console.log("\x1b[31m[ERROR] " + e.message + "\x1b[0m");
        }
    }
}

const cheerio = require('cheerio');

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
    name: "notice",
    help: "usage: notice <course id or nickname> <notice id>",
    async execute(lms, args) {
        let [courseIdOrNickname, noticeId] = args;
        if (!lms.isLoggedIn()) {
            console.log("\x1b[31m[ERROR] 로그인이 필요합니다.\x1b[0m");
            return;
        }

        // 별칭 리스트에서 ID 찾기 또는 직접 입력받은 ID 사용
        const nicknameList = lms.config.get("nicknameList") || [];
        const courseId = nicknameList.find(item => item.name === courseIdOrNickname)?.id || courseIdOrNickname;

        if (!courseId) {
            console.log("\x1b[31m[ERROR] 강의 ID 또는 별칭을 입력해주세요.\x1b[0m");
            return;
        }

        try {
            const url = `https://mylms.korea.ac.kr/api/v1/courses/${courseId}/discussion_topics?only_announcements=true&per_page=40&page=1&filter_by=all&no_avatar_fallback=1&include%5B%5D=sections_user_count&include%5B%5D=sections`;
            const response = await lms.client.get(url);
            const announcements = response.data;

            if (!announcements || announcements.length === 0) {
                console.log("\x1b[33m[LOG] 공지사항이 없습니다.\x1b[0m");
                return;
            }

            if (noticeId) {
                console.log(noticeId);
                const notice = announcements.find(item => item.id === Number(noticeId));
                if (!notice) {
                    console.log("\x1b[31m[ERROR] 공지사항을 찾을 수 없습니다.\x1b[0m");
                    return;
                }

                const date = formatDate(notice.posted_at || notice.created_at);
                const author = notice.author?.display_name || "알 수 없음";
                const title = notice.title;
                const message = cheerio.load(notice.message).text();

                console.log(title);
                console.log("\n" + "─".repeat(80) + "\n");
                console.log(message);
                console.log("\n" + "─".repeat(80) + "\n");
                console.log();

                return;
            }

            console.log(`\n=== 📢 공지사항 목록 (최근 ${announcements.length}개) ===\n`);

            announcements.forEach(item => {
                const date = formatDate(item.posted_at || item.created_at);
                const author = item.author?.display_name || "알 수 없음";
                const title = item.title.length > 40 ? item.title.substring(0, 37) + "..." : item.title;
                const unread = item.read_state === 'unread' ? "\x1b[31m●\x1b[0m" : " ";
                const id = item.id;

                // 한 줄 출력: [상태] [ID] 날짜 | 작성자 | 제목
                console.log(`${unread} [${id}] \x1b[2m${date}\x1b[0m | \x1b[33m${author.substring(0, 10).padEnd(10)}\x1b[0m | ${title}`);
            });

            console.log("\n" + "─".repeat(80) + "\n");

        } catch (error) {
            console.log("\x1b[31m[ERROR] " + error.message + "\x1b[0m");
        }
    }
}
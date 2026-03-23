

const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const i = String(date.getMinutes()).padStart(2, '0');
    return `${m}/${d} ${h}:${i}`;
};

const getDayName = (isoString) => {
    const date = new Date(isoString);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
};

module.exports = {
    name: "planner",
    help: "usage: planner",
    async execute(lms, args) {

        if (!lms.isLoggedIn()) {
            console.log("\x1b[31m[ERROR] 로그인이 필요합니다.\x1b[0m");
            return;
        }

        try {
            // 시작 날짜를 현재 시간으로 설정 (ISO 8601 형식)
            const url = "https://mylms.korea.ac.kr/api/v1/planner/items?start_date=" + new Date().toISOString();
            const response = await lms.client.get(url);
            const items = response.data;

            console.log(`\n===  학습 플래너 (향후 일정) ===\n`);

            if (!items || items.length === 0) {
                console.log("  남은 일정이 없습니다.");
            } else {
                let currentDay = "";

                items.forEach(item => {
                    const plannable = item.plannable;
                    if (!plannable) return;

                    const dateObj = new Date(item.plannable_date);
                    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} (${getDayName(item.plannable_date)})`;

                    // 날짜가 바뀌면 구분선 출력
                    if (currentDay !== dateStr) {
                        if (currentDay !== "") console.log("");
                        console.log(`\x1b[36m[ ${dateStr} ]\x1b[0m`);
                        currentDay = dateStr;
                    }

                    // 제출 상태 확인 (submissions 객체가 있는 경우)
                    let statusIcon = "🔹"; // 기본 아이콘 (강의 등)
                    if (item.submissions) {
                        statusIcon = item.submissions.submitted ? "\x1b[32m✅\x1b[0m" : "\x1b[31m❌\x1b[0m";
                    } else if (item.plannable_type === 'announcement') {
                        statusIcon = "📢";
                    }

                    const time = formatDate(item.plannable_date).split(' ')[1];
                    const courseName = (item.context_name || "일반").split(']')[0].replace('(', '').replace(')', '').substring(0, 15);
                    const title = plannable.title || "제목 없음";

                    console.log(`  ${statusIcon} \x1b[2m${time}\x1b[0m | \x1b[33m${courseName.padEnd(15)}\x1b[0m | ${title}`);
                });
            }
            console.log("\n" + "─".repeat(70) + "\n");

        } catch (error) {
            console.log("\x1b[31m[ERROR] " + error.message + "\x1b[0m");
        }
    }
}
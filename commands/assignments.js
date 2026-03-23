
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
    name: "assignments",
    help: "usage : assignments <course_id>",
    async execute(lms, args) {
        if (!lms.isLoggedIn()) {
            console.log("\x1b[31m[ERROR] 로그인이 필요합니다.\x1b[0m");
            return;
        }

        try {
            const courseIdOrName = args[0];
            let query = new URLSearchParams({
                "type": "assignment",
                "per_page": "100"
            }).toString();

            if (!courseIdOrName) {
                const courseUrl = "https://mylms.korea.ac.kr/api/v1/users/self/favorites/courses?include[]=term&exclude[]=enrollments&sort=nickname";
                const courseResponse = await lms.client.get(courseUrl);
                const courses = courseResponse.data;
                courses.forEach(element => {
                    query += "&context_codes%5B%5D=course_" + element.id;
                });
            } else {
                query += "&context_codes%5B%5D=course_" + courseIdOrName;
            }

            const url = "https://mylms.korea.ac.kr/api/v1/calendar_events?" + query;
            const response = await lms.client.get(url);
            const assignments = response.data;

            console.log(`\n=== 과제 목록 (총 ${assignments.length}개) ===\n`);

            if (assignments.length === 0) {
                console.log("  모든 과제를 완료했거나 등록된 과제가 없습니다.");
            } else {
                assignments.forEach(item => {
                    const assignment = item.assignment;
                    if (!assignment) return; // assignment 객체가 없는 경우 방지

                    const status = assignment.user_submitted ? "\x1b[32m✅\x1b[0m" : "\x1b[31m❌\x1b[0m";
                    const due = formatDate(assignment.due_at);
                    const courseName = item.context_name || "알 수 없는 과목";
                    const title = assignment.name.length > 30 ? assignment.name.substring(0, 27) + "..." : assignment.name;
                    
                    // 한 줄 출력: [상태] [ID] 과목명 | 과제명 | 마감
                    console.log(`${status} [${item.id.replace('assignment_', '')}] \x1b[33m${courseName.substring(0, 20).padEnd(20)}\x1b[0m | ${title.padEnd(30)} | 마감: ${due}`);
                });
            }
            console.log("\n" + "─".repeat(95) + "\n");

        } catch (error) {
            console.log("\x1b[31m[ERROR] " + error.message + "\x1b[0m");
        }
    }
}

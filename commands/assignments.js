const cheerio = require("cheerio");

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
    help: "usage : assignments <course=course id or nickname> <assignment=specific assignment id>",
    async execute(lms, args) {
        if (!lms.isLoggedIn()) {
            console.log("\x1b[31m[ERROR] 로그인이 필요합니다.\x1b[0m");
            return;
        }

        const params = {};
        args.forEach(element => {
           const sliced = element.split("=");
           if (sliced.length === 2) params[sliced[0]] = sliced[1];
        });
        
        const nicknameList = lms.config.get("nicknameList") || [];
        const picked = nicknameList.find(x => x.name === params.course);
        const courseId = picked ? picked.id : params.course;

        // 특정 과제 상세 조회 (this.assignmentsCache 대신 lms.assignmentsCache 사용 가능 여부 확인 후 처리)
        // 사용자가 요청한 대로 "this.assignmentsCache" 또는 lms 객체에 저장된 캐시 활용
        if (params.assignment) {
            const cache = lms.assignmentsCache || [];
            if (cache.length === 0) {
                console.log("\x1b[33m[INFO] 과제 목록 캐시가 비어 있어 상세 정보를 표시할 수 없습니다. 먼저 전체 목록을 조회해 주세요.\x1b[0m");
                return;
            }

            // calendar_events ID는 "assignment_215228" 형태이거나 숫자 ID일 수 있음
            const targetId = params.assignment.startsWith('assignment_') ? params.assignment : `assignment_${params.assignment}`;
            const target = cache.find(a => a.id === targetId || (a.assignment && a.assignment.id.toString() === params.assignment));

            if (!target) {
                console.log(`\x1b[31m[ERROR] ID가 ${params.assignment}인 과제를 캐시에서 찾을 수 없습니다.\x1b[0m`);
                return;
            }

            const asgn = target.assignment || target;
            console.log(`\n\x1b[1m\x1b[36m[ ASSIGNMENT DETAIL ]\x1b[0m`);
            console.log("\x1b[90m" + "─".repeat(80) + "\x1b[0m");
            console.log(`\x1b[1mTitle:\x1b[0m     ${target.title || asgn.name}`);
            console.log(`\x1b[1mCourse:\x1b[0m    ${target.context_name || "Unknown"}`);
            console.log(`\x1b[1mDue:\x1b[0m       ${formatDate(target.end_at || asgn.due_at)}`);
            console.log(`\x1b[1mSubmitted:\x1b[0m ${asgn.user_submitted ? "\x1b[32mYES\x1b[0m" : "\x1b[33mNO\x1b[0m"}`);
            console.log(`\x1b[1mStatus:\x1b[0m    ${asgn.workflow_state || "N/A"}`);
            console.log("\x1b[90m" + "─".repeat(80) + "\x1b[0m");
            
            if (asgn.description) {
                const desc = cheerio.load(asgn.description).text().trim();
                console.log(desc || "No description provided.");
            } else {
                console.log("No description provided.");
            }
            console.log("\x1b[90m" + "─".repeat(80) + "\x1b[0m\n");
            return;
        }

        const allCourses = await lms.getCourses();
        let url = `https://mylms.korea.ac.kr/api/v1/calendar_events?type=assignment&start_date=2026-02-28T15%3A00%3A00.000Z&end_date=${(new Date()).toISOString()}&per_page=50`;
        
        if (courseId) {
            url += `&context_codes%5B%5D=course_${courseId}`;
        } else {
            allCourses.forEach(x => url += `&context_codes%5B%5D=course_${x.id}`);
        }

        try {
            const response = await lms.client.get(url);
            const events = response.data || [];
            
            // 캐시 저장
            lms.assignmentsCache = events;

            if (events.length === 0) {
                console.log("\x1b[33m[INFO]\x1b[0m No assignments found.");
            } else {
                // Sort by end_at (due date)
                events.sort((a, b) => new Date(a.end_at || '9999') - new Date(b.due_at || '9999'));

                console.log("\n\x1b[1m\x1b[35m" + "=".repeat(140) + "\x1b[0m");
                console.log("\x1b[1m\x1b[35m   ID            | STATUS   | COURSE NAME                    | ASSIGNMENT NAME                                    | DUE DATE\x1b[0m");
                console.log("\x1b[1m\x1b[35m" + "=".repeat(140) + "\x1b[0m");

                events.forEach((event) => {
                    const asgn = event.assignment || {};
                    const isSubmitted = asgn.user_submitted;
                    const statusStr = isSubmitted ? "\x1b[32m[제출]\x1b[0m  " : "\x1b[33m[미제출]\x1b[0m";
                    
                    const date = formatDate(event.end_at);
                    const courseName = (event.context_name || "Unknown").substring(0, 30).padEnd(30);
                    const title = (event.title || "No Title").length > 50 ? event.title.substring(0, 47) + "..." : event.title.padEnd(50);
                    const aid = event.id.replace('assignment_', '').padEnd(12);
                    
                    const isOverdue = event.end_at && new Date(event.end_at) < new Date();
                    const dateColor = isOverdue ? "\x1b[31m" : "\x1b[90m";

                    console.log(`\x1b[90m${aid}\x1b[0m | ${statusStr} | \x1b[33m${courseName}\x1b[0m | \x1b[1m${title}\x1b[0m | ${dateColor}${date}\x1b[0m`);
                });
                console.log("\x1b[1m\x1b[35m" + "=".repeat(140) + "\x1b[0m\n");
            }
        } catch (error) {
            console.log("[ERROR] " + error.message);
        }
    }
}

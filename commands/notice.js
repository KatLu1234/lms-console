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
    help: "usage: notice <course=(id or nickname)> <notice=(notice id)>",
    async execute(lms, args) {
        
        const params = {};
        args.forEach(x => {
            const sliced = x.split("=");
            params[sliced[0]] = sliced[1];
        });

        const courseIdOrNickname = params["course"];
        const picked = (lms.config.get("nicknameList") || []).find(x => x.name === courseIdOrNickname);
        const courseId = (picked) ? picked.id : courseIdOrNickname;
        let announcements = [];

        try {

            if (params.notice) {
                if (this.announcementsCache) {
                    const announcement = this.announcementsCache.find(x => x.id === Number(params.notice));
                    
                    console.log(announcement.title);
                    console.log("\n" + "-".repeat(70) + "\n");
                    console.log(announcement.message.replace(/<[^>]*>?/gm, ''));
                    console.log();
                    return;
                }
                else console.log("[LOG] 구현안됨");
            }

            const allCourses = await lms.getCourses();
            const courseMap = {};
            allCourses.forEach(c => courseMap[`course_${c.id}`] = c.name);

            let searchParams = new URLSearchParams({
                "per_page": "10",
                "page": "1",
                "start_date": "1900-01-01",
                "end_date": (new Date()).toISOString()
            }).toString();

            if (courseId) {
                searchParams += `&context_codes[]=course_${courseId}`;
            }
            else {
                allCourses.forEach(x => searchParams += `&context_codes[]=course_${x.id}`);
            }

            const response = await lms.client.get("https://mylms.korea.ac.kr/api/v1/announcements?" + searchParams);
            announcements = response.data;

            this.announcementsCache = announcements;

            if (announcements.length === 0) {
                console.log("\x1b[33m[INFO]\x1b[0m No announcements found.");
            } else {
                console.log("\n\x1b[1m\x1b[36m" + "=".repeat(120) + "\x1b[0m");
                console.log("\x1b[1m\x1b[36m   ID       | STATUS | COURSE NAME          | TITLE                                              | AUTHOR     | DATE\x1b[0m");
                console.log("\x1b[1m\x1b[36m" + "=".repeat(120) + "\x1b[0m");

                announcements.forEach((announcement) => {
                    const isNew = announcement.read_state === 'unread';
                    const status = isNew ? "\x1b[41m\x1b[37m NEW \x1b[0m" : "     ";
                    const date = formatDate(announcement.posted_at);
                    const courseName = (courseMap[announcement.context_code] || "Unknown").substring(0, 20).padEnd(20);
                    const title = announcement.title.length > 50 ? announcement.title.substring(0, 47) + "..." : announcement.title.padEnd(50);
                    const author = (announcement.user_name || "Unknown").substring(0, 10).padEnd(10);
                    const aid = announcement.id.toString().padEnd(8);

                    console.log(`\x1b[90m${aid}\x1b[0m | ${status} | \x1b[33m${courseName}\x1b[0m | \x1b[1m${title}\x1b[0m | \x1b[32m${author}\x1b[0m | \x1b[90m${date}\x1b[0m`);
                });
                console.log("\x1b[1m\x1b[36m" + "=".repeat(120) + "\x1b[0m\n");
            }
            } catch (error) {
                console.log("[ERROR] " + error.message);
            }
        } 
}
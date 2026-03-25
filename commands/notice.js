

module.exports = {
    name: "notice",
    help: "usage : notice [notice id (optional)]",
    async execute(lms, args) {
        try {
            const courses = await lms.getCourses();
            let url = "learningx_total_board/announcements?page=1&enrollment_type=learning&";
            courses.forEach(x => url += `course_ids[]=${x.id}&`)
            
            const data = await lms.requestLearningXApi(url);
            const items = data.items;

            console.log("\n  📢 [ 최근 공지사항 ]");
            console.log("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            if (!items || items.length === 0) {
                console.log("  📭 새로운 공지사항이 없습니다.");
            } else {
                items.forEach(item => {
                    const date = new Date(item.created_at).toLocaleString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric'
                    });

                    const unreadIcon = item.unread ? "✨" : "  ";
                    
                    let courseName = item.course_name;
                    if (courseName.length > 15) courseName = courseName.substring(0, 12) + "...";

                    let title = item.title;
                    if (title.length > 30) title = title.substring(0, 27) + "...";

                    console.log(`  ${unreadIcon} [공지] ${title.padEnd(30)} | ${courseName.padEnd(15)} | ${item.user_name.padEnd(6)} | 📅 ${date}`);
                });
            }

            console.log("\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        } catch (error) {
            console.log("[ERROR] " + error.message);
        }
    }
}

//"course_id":88359,"course_name":"261R (\uc138\uc885-\ud559\ubd80)\ucef4\ud4e8\ud130\ub124\ud2b8\uc6cc\ud06c(\uc601\uac15)(COMPUTER NETWORK(English))-00\ubd84\ubc18","title":" Next Friday (03.April)\u2019s 9:00 AM in-class session","user_name":"\uc870\ubcd1\uc9c4","comment_count":null,"latest_comment_created_at":null,"view_count":84,"view_url":"https:\/\/mylms.korea.ac.kr\/courses\/88359\/discussion_topics\/375187","unread":true,"created_at":"2026-03-24T08:57:18.603019Z"
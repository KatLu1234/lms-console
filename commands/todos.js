
module.exports = {
    name : "todos",
    usage : "todos",
    async execute(lms, args) {
        try {
            const courses = await lms.getCourses();
            const courseMap = {};
            courses.forEach(c => {
                courseMap[c.id] = c.name;
            });

            const data = await lms.getTodos();
            const todos = data.to_dos;

            console.log("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            let hasAnyTodo = false;

            todos.forEach(courseTodo => {
                const list = courseTodo.todo_list;
                if (list.length === 0) return;

                hasAnyTodo = true;
                let courseName = courseMap[courseTodo.course_id] || `ID: ${courseTodo.course_id}`;
                if (courseName.length > 20) courseName = courseName.substring(0, 17) + "...";

                console.log(`\n  📘 ${courseName}`);

                list.forEach(item => {
                    const dueDate = new Date(item.due_date).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    let typeIcon = "🔹";
                    let typeStr = "";
                    switch(item.component_type) {
                        case "commons": 
                            typeIcon = "🎥"; 
                            typeStr = "콘텐츠"; 
                            break;
                        case "assignment": 
                            typeIcon = "📝"; 
                            typeStr = "과제  "; 
                            break;
                        case "quiz": 
                            typeIcon = "📑"; 
                            typeStr = "퀴즈  "; 
                            break;
                        default: 
                            typeStr = item.component_type;
                    }

                    let title = item.title;
                    if (title.length > 30) title = title.substring(0, 27) + "...";

                    console.log(`    ${typeIcon} [${typeStr}] ${title.padEnd(30)}  📅 ${dueDate}`);
                });
            });

            console.log("\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            if (hasAnyTodo) {
                console.log(`  📬 미읽은 메시지: ${data.total_unread_messages.toString().padStart(2)}개  |  🏫 진행 중 강좌: ${data.total_count.toString().padStart(2)}개`);
            } else {
                console.log("  🎉 모든 할 일을 완료했습니다! 정말 멋져요!");
            }
            console.log("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        } catch (e) {
            console.log("[ERROR] " + e.message);
        }
    }
}


/*
{"to_dos":[{"course_id":88360,"activities":{"total_unread_announcements":2,"total_announcements":9,"total_unread_resources":0,"total_resources":0,"total_incompleted_video_conferences":0,"total_incompleted_metaverse_conferences":0,"total_incompleted_commons_resources":0,"total_incompleted_smart_attendances":0,"total_incompleted_movies":0,"total_unsubmitted_assignments":0,"total_unsubmitted_quizzes":0,"total_unsubmitted_discussion_topics":0},"todo_list":[]},{"course_id":88358,"activities":{"total_unread_announcements":2,"total_announcements":6,"total_unread_resources":0,"total_resources":0,"total_incompleted_video_conferences":0,"total_incompleted_metaverse_conferences":0,"total_incompleted_commons_resources":0,"total_incompleted_smart_attendances":0,"total_incompleted_movies":0,"total_unsubmitted_assignments":0,"total_unsubmitted_quizzes":0,"total_unsubmitted_discussion_topics":0},"todo_list":[]},{"course_id":88342,"activities":{"total_unread_announcements":0,"total_announcements":1,"total_unread_resources":0,"total_resources":0,"total_incompleted_video_conferences":0,"total_incompleted_metaverse_conferences":0,"total_incompleted_commons_resources":0,"total_incompleted_smart_attendances":0,"total_incompleted_movies":2,"total_unsubmitted_assignments":1,"total_unsubmitted_quizzes":0,"total_unsubmitted_discussion_topics":0},"todo_list":[{"section_id":0,"unit_id":0,"component_id":243094,"generated_from_lecture_content":true,"component_type":"commons","title":"NA-07-LUFactorization","due_date":"2026-03-30T14:59:59Z","commons_type":"mp4"},{"section_id":0,"unit_id":0,"component_id":243095,"generated_from_lecture_content":true,"component_type":"commons","title":"NA-08-MatrixInverse","due_date":"2026-03-30T14:59:59Z","commons_type":"mp4"},{"section_id":0,"unit_id":0,"component_id":0,"generated_from_lecture_content":false,"component_type":"assignment","assignment_id":218049,"title":"Homework 3","due_date":"2026-03-31T02:00:00Z"}]},{"course_id":88359,"activities":{"total_unread_announcements":1,"total_announcements":4,"total_unread_resources":0,"total_resources":0,"total_incompleted_video_conferences":0,"total_incompleted_metaverse_conferences":0,"total_incompleted_commons_resources":0,"total_incompleted_smart_attendances":0,"total_incompleted_movies":2,"total_unsubmitted_assignments":4,"total_unsubmitted_quizzes":0,"total_unsubmitted_discussion_topics":0},"todo_list":[{"section_id":0,"unit_id":0,"component_id":256625,"generated_from_lecture_content":true,"component_type":"commons","title":"CN_Module2_Session1","due_date":"2026-03-26T00:59:59Z","commons_type":"everlec"},{"section_id":0,"unit_id":0,"component_id":256626,"generated_from_lecture_content":true,"component_type":"commons","title":"CN_Module2_Session2","due_date":"2026-03-26T01:59:59Z","commons_type":"everlec"},{"section_id":0,"unit_id":0,"component_id":0,"generated_from_lecture_content":false,"component_type":"assignment","assignment_id":218112,"title":"GroupAsssignment3","due_date":"2026-03-30T14:59:59Z"},{"section_id":0,"unit_id":0,"component_id":0,"generated_from_lecture_content":false,"component_type":"assignment","assignment_id":214495,"title":"Module5_Project_InterDeliverable_Proposal","due_date":"2026-04-03T14:59:59Z"},{"section_id":0,"unit_id":0,"component_id":0,"generated_from_lecture_content":false,"component_type":"assignment","assignment_id":214496,"title":"Module5_Project_FinalDeliverable_Presentation","due_date":"2026-06-12T14:59:59Z"}]},{"course_id":88344,"activities":{"total_unread_announcements":0,"total_announcements":1,"total_unread_resources":0,"total_resources":0,"total_incompleted_video_conferences":0,"total_incompleted_metaverse_conferences":0,"total_incompleted_commons_resources":0,"total_incompleted_smart_attendances":0,"total_incompleted_movies":0,"total_unsubmitted_assignments":0,"total_unsubmitted_quizzes":0,"total_unsubmitted_discussion_topics":0},"todo_list":[]},{"course_id":91702,"activities":{"total_unread_announcements":0,"total_announcements":0,"total_unread_resources":0,"total_resources":0,"total_incompleted_video_conferences":0,"total_incompleted_metaverse_conferences":0,"total_incompleted_commons_resources":0,"total_incompleted_smart_attendances":0,"total_incompleted_movies":6,"total_unsubmitted_assignments":0,"total_unsubmitted_quizzes":0,"total_unsubmitted_discussion_topics":0},"todo_list":[{"section_id":0,"unit_id":0,"component_id":248650,"generated_from_lecture_content":true,"component_type":"commons","title":"KUS \uc2ec\ub9ac\uc801\uc751\uac80\uc0ac \ud574\uc11d \uc601\uc0c1(\ucd5c\uc885 \uc74c\uc131)","due_date":"2026-06-12T14:59:59Z","commons_type":"mp4"},{"section_id":0,"unit_id":0,"component_id":251040,"generated_from_lecture_content":true,"component_type":"commons","title":"[\uc815\uc2e0\uac74\uac15 \uc601\uc5ed] \/ \ub9c8\uc74c\uc758 \uad6c\uc870\uc2e0\ud638\uc5d0 \uadc0\uae30\uc6b8\uc5ec \uc8fc\uc138\uc694 | \uc7a5\ub3d9\uc120 \ub1cc\uacfc\ud559\uc790 | #\uc815\uc2e0\uac74\uac15 #\uc6b0\uc6b8 #\uc2ec\ub9ac #MindSOS | \uc138\ubc14\uc2dc 1815\ud68c","due_date":"2026-06-26T14:59:59Z","commons_type":"youtube"},{"section_id":0,"unit_id":0,"component_id":251042,"generated_from_lecture_content":true,"component_type":"commons","title":"[\uc815\uc2e0\uac74\uac15 \uc601\uc5ed] \/ \ud798\ub4e4 \ub54c \"\ub0b4\uac00 \uc81c\uc77c \ud798\ub4e4\uc5b4\"\ub77c\uace0 \ub9d0\ud574\uc57c \ud558\ub294 \uc774\uc720  | \u6545 \ubc31\uc138\ud76c \uc791\uac00, '\uc8fd\uace0 \uc2f6\uc9c0\ub9cc \ub5a1\ubcf6\uc774\ub294 \uba39\uace0 \uc2f6\uc5b4' \uc800\uc790 | \uc6b0\uc6b8 \uc704\ub85c \uac10\uc815 | \uc138\ubc14\uc2dc 1260\ud68c","due_date":"2026-06-26T14:59:59Z","commons_type":"youtube"},{"section_id":0,"unit_id":0,"component_id":251045,"generated_from_lecture_content":true,"component_type":"commons","title":"[\uc815\uc2e0\uac74\uac15 \uc601\uc5ed] \/ \uc65c \ub098\ub294 \uacc4\uc18d \ubd88\uc548\ud558\uace0 \ub450\ub824\uc6b8\uae4c? \u3160\u3160 | \ud558\uc9c0\ud604 \uc815\uc2e0\uac74\uac15\uc758\ud559\uacfc \uc804\ubb38\uc758 | #\ubd88\uc548\uc7a5\uc560 #\uc815\uc2e0\uac74\uac15 #\uc6b0\uc6b8 #\uc2ec\ub9ac | \uc138\ubc14\uc2dc 1801\ud68c","due_date":"2026-06-26T14:59:59Z","commons_type":"youtube"},{"section_id":0,"unit_id":0,"component_id":251047,"generated_from_lecture_content":true,"component_type":"commons","title":"[\ub300\ud559\uc801\uc751 \uc601\uc5ed] \/ \uc798\ud558\ub824\uace0 \ud588\ub294\ub370, \uc65c \ub098\ub294 \ub298 \uc774 \ubaa8\uc591\uc77c\uae4c? | \uc790\uae30\ube44\ub09c\uc744 \uba48\ucd94\ub294 \ubc95 | \uc9c0\ub098\uc601 \uad50\uc218 | \uc790\uae30\uc0ac\ub791 \uc790\uc874\uac10 \uc790\uc2e0\uac10 \ud589\ubcf5 | \uc624\ub298, \uc774 \uc9c8\ubb38","due_date":"2026-06-26T14:59:59Z","commons_type":"youtube"}]},{"course_id":88356,"activities":{"total_unread_announcements":0,"total_announcements":2,"total_unread_resources":0,"total_resources":0,"total_incompleted_video_conferences":0,"total_incompleted_metaverse_conferences":0,"total_incompleted_commons_resources":0,"total_incompleted_smart_attendances":0,"total_incompleted_movies":0,"total_unsubmitted_assignments":1,"total_unsubmitted_quizzes":0,"total_unsubmitted_discussion_topics":0},"todo_list":[{"section_id":0,"unit_id":0,"component_id":0,"generated_from_lecture_content":false,"component_type":"assignment","assignment_id":220694,"title":"#2\ucc28 \uacfc\uc81c","due_date":"2026-03-30T03:01:00Z"}]}],"total_unread_messages":112,"total_count":7}
*/
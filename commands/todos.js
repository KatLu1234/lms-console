
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



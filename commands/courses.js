
module.exports = {
    name: "courses",
    help: "usage : courses ",
    async execute(lms, args) {
        
        const url = 'https://mylms.korea.ac.kr/api/v1/planner/items';
        const now = new Date();
        now.setMonth(now.getMonth() - 9);
        const startDate = now.toISOString();      
        
        try {
            const data = await lms.getCourses();

            const courses = data.map(course => ({
                ID: course.id,
                Name: course.name,
                Term: course.term ? course.term.name : 'N/A',
                Professors: course.professors ? course.professors.map(professor => professor.name).join(', ') : 'N/A'
            }));

            console.table(courses);
        } catch (e) {
            console.log("[ERROR] " + e.message);
        }
    }
}

module.exports = {
    name: "courses",
    help: "usage : courses ",
    async execute(lms, args) { 
        
        try {
            const data = await lms.getCourses();

            const courses = data.map(course => ({
                ID: course.id,
                Name: course.name,
                Professors: (course.professors) ? course.professors : 'N/A'
            }));

            console.table(courses);
        } catch (e) {
            console.log("[ERROR] " + e.message);
        }
    }
}
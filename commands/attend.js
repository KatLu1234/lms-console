const cheerio = require("cheerio");

module.exports = {
    "name": "test",
    "help": "usage: test",
    async execute(lms, args) {

        try {

            

        } catch (error) {
            console.log(error);
        }

    }
}

async function getAttendanceRequest(lms) {
    try {
        const requestPart = await lms.client.get("https://mylms.korea.ac.kr/courses/88358/external_tools/24");
        let $ = cheerio.load(requestPart.data);

        const form = {};
        $("form[id='tool_form']").find("input[type='hidden']")
        .map((i, el) => {
          form[el.attribs.name] = el.attribs.value;
        });
        const forwardUrl = $("iframe[id='post_message_forwarding']").attr("src");

        const postForward = await lms.client.get(forwardUrl);
        const requestAuth = await lms.client.post("https://mylms.korea.ac.kr/learningx/lti/smart_attendance",
            new URLSearchParams(form).toString()
        );

        $ = cheerio.load(requestAuth.data);
        const attendanceInfo = $("div[id'root']").attr("data-attendance");
        return JSON.parse(attendanceInfo.replace(/&quot;/g, '"'));

    } catch (error) {
        console.log(`[ERROR] ${error.message}`);
    }
}
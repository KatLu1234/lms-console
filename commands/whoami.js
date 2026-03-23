
module.exports = {
    name: "whoami",
    help: "usage : whoami",
    async execute(lms, args) {
        try{

            await lms.client.get("https://mylms.korea.ac.kr");

            console.log(lms.cookies.getCookiesSync("https://lms.korea.ac.kr"));
            console.log(lms.cookies.getCookiesSync("https://mylms.korea.ac.kr"));
            console.log(lms.cookies.getCookiesSync("https://ksso.korea.ac.kr"));
        } catch (error) {
            console.log("[LOG] " + error);
        }
    }
}
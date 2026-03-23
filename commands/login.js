const keytar = require('keytar');
const cheerio = require('cheerio');
const NodeRSA = require('node-rsa');
const cryption = require('../utils/cryption');

module.exports = {
    "name": "login",
    "help": "usage: login",
    async execute(lms, args) {

        const username = await keytar.getPassword('lms-console', "username");
        const password = await keytar.getPassword('lms-console', "password");
        
        if (lms.isLoggedIn()) {
            console.log("[LOG] 이미 로그인되어 있습니다.");
            return;
        }
        try {
            console.log('[LOG] K-SSO 인증 시작...');
            const authUrl = "https://ksso.korea.ac.kr/svc/tk/Auth.do?id=lms&ac=Y&ifa=N&RelayState=https://lms.korea.ac.kr/xn-sso/gw-cb.php?from=&site=&login_type=&return_url=&";

            const loginPageUrl = authUrl;
            const loginPageRes = await lms.client.get(loginPageUrl);

            let $ = cheerio.load(loginPageRes.data);
            const l_token = $('#l_token').val();
            const c_token = $('#c_token').val();


            console.log('[LOG] 토큰 획득 완료');

            // 3. ID/PW 검증 (UserTypeCheck)

            console.log('[LOG] ID/PW 검증 중...');
            const checkRes = await lms.client.post('https://ksso.korea.ac.kr/logincheck/UserTypeCheck.do', 
                new URLSearchParams({
                    'one_id': username,
                    'user_password': password,
                    'l_token': l_token,
                    'c_token': c_token,
                    
                }).toString(),
                { headers: {
                     'Referer': authUrl,
                     'Content-Type': 'application/x-www-form-urlencoded',
                     'X-Requested-With': 'XMLHttpRequest',
                     'Origin': 'https://ksso.korea.ac.kr',
                     'Upgrade-Insecure-Requests': '1'
                } }
            );


            if (checkRes.data.success === "false") {
                console.log('[ERROR] 로그인 실패: 아이디 또는 비밀번호가 잘못되었습니다.');
                return;
            } 

            const studentNumber = checkRes.data.types[0]["user_id"];
            lms.studentNumber = studentNumber;
            const otpRes = await lms.client.post('https://ksso.korea.ac.kr/logincheck/OTPCheck.do', 
                new URLSearchParams({ 'type': 'NeedOTPCheck', 'emp_no': studentNumber }).toString(),
                { headers: { 'Referer': authUrl,
                     'Content-Type': 'application/x-www-form-urlencoded',
                     'X-Requested-With': 'XMLHttpRequest',
                     'Origin': 'https://ksso.korea.ac.kr',
                     'Upgrade-Insecure-Requests': '1' } }
            );


            await new Promise(resolve => setTimeout(resolve, 500));

            const currentJar = lms.client.defaults.jar;
            const cookieToRequest = await currentJar.getCookieString('https://ksso.korea.ac.kr');

            console.log("[LOG] 로그인 실행....");

            const loginRes = await lms.client.post('https://ksso.korea.ac.kr/Login.do', 
                new URLSearchParams({
                    'user_id': studentNumber,
                    'one_id': username,
                    'user_password': password,
                    'l_token': l_token,
                    'c_token': checkRes.data.c_token,
                    "user_timezone_offset": "-540"
                }).toString(),
                { headers: { 'Referer': authUrl,
                     'X-Requested-With': 'XMLHttpRequest',
                     'Origin': 'https://ksso.korea.ac.kr',
                     'Upgrade-Insecure-Requests': '1' } }
            );

            const scriptContent = cheerio.load(loginRes.data)('script').html();
            const iframeSrcMatch = scriptContent.match(/iframe\.src\s*=\s*"([^"]+)"/);
            
            if (!iframeSrcMatch || !iframeSrcMatch[1]) {
                console.log('[ERROR] 로그인 실패: iframe URL을 찾을 수 없습니다.');
                return;
            }

            const pseudonymRes = await lms.client.get(iframeSrcMatch[1]);
            const html = pseudonymRes.data;

            const rsaRegex = /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/;
            const rsaMatches = html.match(rsaRegex);
            const rsaKeyPem = rsaMatches ? rsaMatches[0] : null;

            const encryptedDataRegex = /submitTest\s*\(\s*event\s*,\s*'([^']+)'\s*\)/;
            const encryptedDataMatch = html.match(encryptedDataRegex);
            const encryptedData = encryptedDataMatch ? encryptedDataMatch[1] : null;

            if (!rsaKeyPem || !encryptedData) {
                console.log('[ERROR] 로그인 실패: RSA 인증을 할 수 없습니다.');
            }

            const decryptedData = cryption.decryptRSAPrivate(rsaKeyPem, encryptedData);
            console.log("[LOG] 지문 추출 완료");

            $ = cheerio.load(html);

            const xsrfToken = $('meta[name="csrf-token"]').attr('content');

            console.log("[LOG] MyLMS 로그인 실행...");
            const loginRes2 = await lms.client.post('https://mylms.korea.ac.kr/login/canvas', 
                new URLSearchParams(
                    {
                        "utf8": $('input[name="utf8"]').val(),
                        "redirect_to_ssl": $('input[name="redirect_to_ssl"]').val(),
                        "after_login_url": $('input[name="after_login_url"]').val(),
                        "pseudonym_session[unique_id]": $('input[name="pseudonym_session[unique_id]"]').val(),
                        "pseudonym_session[password]": decryptedData,
                        "pseudonym_session[remember_me]": "0",
                    }
                ).toString(), 
            {
                headers: {
                    'Cache-Control': 'max-age=0',
                    'Referer': iframeSrcMatch[1],
                    'Origin': 'https://mylms.korea.ac.kr',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'iframe',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin',
                }
            });
            if (lms.cookies.getCookiesSync("https://mylms.korea.ac.kr").find(c => c.key === '_csrf_token')) {
                console.log("[LOG] 로그인 성공");
            } else {
                console.log("[ERROR] 로그인 실패");
                return;
            }

        } catch (error) {
            console.error('[Error] 로그인 실패: ', error.message);
            if (error.response) console.log('에러 상태 코드:', error.response.status);
        }
    }
}
#!/usr/bin/env node

const { chromium } = require('playwright');
const { execSync } = require('child_process');
const readline = require('readline');
const readlineSync = require('readline-sync');
const cryption = require('./utils/cryption');
const cheerio = require("cheerio");
const keytar = require('keytar');
const NodeCache = require('node-cache');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const qs = require('qs');
const { request } = require('http');


/**
 * LMS 과제 제출 프로그램을 위한 Playwright 클래스
 */
class LMSConsole {
  constructor() {
    this.baseUrl = process.env.LMS_URL || 'https://kulms.korea.ac.kr';
    this.cookies = null;
    this.client = null;
    this.config = null;
  }

  /**
   * 브라우저 환경 준비 및 초기화
   */

  isLoggedIn() {
    const csrf_token = this.cookies.getCookiesSync("https://mylms.korea.ac.kr").find(c => c.key === '_csrf_token')?.value;
    return csrf_token !== undefined;
  }

  async init() {

    const { default: Conf } = await import('conf');
    const { wrapper } = await import('axios-cookiejar-support');
    const { CookieJar } = await import('tough-cookie');

    const jar = new CookieJar();
    this.cookies = jar;
    this.client = wrapper(axios.create({
      jar, 
      withCredentials: true,
      validateStatus: (status) => status < 400, 
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Connection': 'keep-alive',
          'Content-Type': 'application/x-www-form-urlencoded'
      }
    }));
    this.config = new Conf({ projectName: 'lms-console' });
    this.studentNumber = "";
    this.cache = new NodeCache({ stdTTL: 3600 * 24 });
  }

  async login(username, password) {
    if (this.isLoggedIn()) {
                console.log("[LOG] 이미 로그인되어 있습니다.");
                return;
            }
            try {
                console.log('[LOG] K-SSO 인증 시작...');
                const authUrl = "https://ksso.korea.ac.kr/svc/tk/Auth.do?id=lms&ac=Y&ifa=N&RelayState=https://lms.korea.ac.kr/xn-sso/gw-cb.php?from=&site=&login_type=&return_url=&";
    
                const loginPageUrl = authUrl;
                const loginPageRes = await this.client.get(loginPageUrl);
    
                let $ = cheerio.load(loginPageRes.data);
                const l_token = $('#l_token').val();
                const c_token = $('#c_token').val();
    
    
                console.log('[LOG] 토큰 획득 완료');
    
                // 3. ID/PW 검증 (UserTypeCheck)
    
                console.log('[LOG] ID/PW 검증 중...');
                const checkRes = await this.client.post('https://ksso.korea.ac.kr/logincheck/UserTypeCheck.do', 
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
                this.studentNumber = studentNumber;
                const otpRes = await this.client.post('https://ksso.korea.ac.kr/logincheck/OTPCheck.do', 
                    new URLSearchParams({ 'type': 'NeedOTPCheck', 'emp_no': studentNumber }).toString(),
                    { headers: { 'Referer': authUrl,
                         'Content-Type': 'application/x-www-form-urlencoded',
                         'X-Requested-With': 'XMLHttpRequest',
                         'Origin': 'https://ksso.korea.ac.kr',
                         'Upgrade-Insecure-Requests': '1' } }
                );
    
    
                await new Promise(resolve => setTimeout(resolve, 500));
    
                const currentJar = this.client.defaults.jar;
                const cookieToRequest = await currentJar.getCookieString('https://ksso.korea.ac.kr');
    
                console.log("[LOG] 로그인 실행....");
    
                const loginRes = await this.client.post('https://ksso.korea.ac.kr/Login.do', 
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
    
                const pseudonymRes = await this.client.get(iframeSrcMatch[1]);
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
                const loginRes2 = await this.client.post('https://mylms.korea.ac.kr/login/canvas', 
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
                if (this.cookies.getCookiesSync("https://mylms.korea.ac.kr").find(c => c.key === '_csrf_token')) {
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

  async requestLearningXToken() {
    try {
      const res = await this.client.get("https://mylms.korea.ac.kr/accounts/1/external_tools/9?launch_type=global_navigation");
      let $ = cheerio.load(res.data);

      const iframeSrc = $("iframe[id='post_message_forwarding']").attr("src");
      const form = {};
      const requestForm = $("form[id='tool_form']")
        .find("input[type='hidden']")
        .map((i, el) => {
          form[el.attribs.name] = el.attribs.value;
        });

      const requestPostForward = await this.client.get(iframeSrc);
      const requestToken = await this.client.post("https://mylms.korea.ac.kr/learningx/lti/dashboard", 
        new URLSearchParams(form).toString(),
        {
          headers: { 
            'Referer': res.request.res.responseUrl
          }
        }
      )

      if (requestToken.status === 200 && requestToken.headers['set-cookie'].find(c => c.includes('xn_api_token'))) {
        this.cache.set("api_login", true);
        return true;
      }

    } catch (error) {
      console.log("[ERROR] requestLearningXToken: " + error.message);
    }
  }

  async requestLearningXApi(url, method = "GET", data = {}) {

    try {
      const res = await this 
        .client({
          method: method,
          url: `https://mylms.korea.ac.kr/learningx/api/v1/${url}`,
          data: data,
          headers: {
            'Referer': 'https://mylms.korea.ac.kr/learningx/lti/dashboard',
            'Authorization': 'Bearer ' + this.cookies.getCookiesSync("https://mylms.korea.ac.kr").find(c => c.key === 'xn_api_token').value,
          },
        });
      return res.data;
      } catch (error) {

        if (error.response.status === 401) {

          if (this.cache.get("api_login")) {
            console.log("[ERROR] requestLearningXApi: ", error.message);
          }
        const res = await this.requestLearningXToken();
        if (res) return await this.requestLearningXApi(url, method, data);
        }
        console.log("[ERROR] requestLearningXApi: ", error.message);
      }
  }

  async getCourses(terms=[]) {
    try {
      let url = "learn_activities/courses?";
      if (terms.length === 0) {
        const currentTerm = await this.getCurrentTerm();
        terms.push(currentTerm);
      }
      terms.forEach(x => url += `term_ids[]=${x.id}&`);
      const courseResponse = await this.requestLearningXApi(url);
      const courses = courseResponse;

      const courseCache = this.cache.get("courses") || [];
      courseCache.push(...courses);
      this.cache.set("courses", courseCache);
      
      return courses;
    
    } catch (error) {
      console.log("[ERROR] getCourses: " + error.message);
    }
  }

  async getTerms() {
    try {
      if (this.cache.get("terms")) return this.cache.get("terms");
      const termResponse = await this.requestLearningXApi(`users/${this.studentNumber}/terms?include_invited_course_contained=true`);
      const terms = termResponse["enrollment_terms"];
      this.cache.set("terms", terms);
      this.cache.set("default_term", terms.find(x => x.default));
      return terms;
    } catch (error) {
      console.log("[ERROR] getTerms: " + error.message);
    }
  }

  async getCurrentTerm() {
    try {
      const cachedTerm = this.cache.get("default_term");
      if (cachedTerm) return cachedTerm;
      
      const terms = await this.getTerms();
      return this.cache.get("default_term");
    } catch (error) {
      console.log("[ERROR] getCurrentTerm: " + error.message);
    }
  }

  async getTodos(term_id) {
    if (!term_id) {
      const currentTerm = await this.getCurrentTerm();
      term_id = currentTerm.id;
    }
    try {
      const todos = await this.requestLearningXApi(`learn_activities/to_dos?term_ids[]=${term_id}`);
      return todos;
    } catch (error) {
      console.log("[ERROR] getTodos: " + error.message);
    }
  }
}

async function main() {
  const lms = new LMSConsole();
  await lms.init();

  console.log();
  console.log('=== KULMS Console ===');
  console.log('');
  console.log('간단한 사용방법: login -> submit [강의 코드] [과제 제출 코드] [과제 제출 파일] -> exit');
  console.log();
  console.log('login => kulms 로그인');
  console.log('planner => 남은 과제 및 일정');
  console.log('notice => 최근 공지사항');
  console.log('todos => 남은 동영상 및 과제');
  console.log('courses => 강의 목록 (id 확인할 때 사용)');
  console.log('cnickname => nickname 으로 강의 id 저장, nickname을 강의 id 대신 사용할 수 있음 (id 는 courses 명령어 입력으로 확인) ex) cnickname algorithm 88358');
  console.log();
  console.log('자세한 사용방법은 help 사용');
  console.log('');

  if (!(await keytar.getPassword('lms-console', "username"))) {
    const username = readlineSync.question('username: ', { hideEchoBack: false });
    console.log('');
    const password = readlineSync.question('password: ', { hideEchoBack: true, mask: '*' });
    console.log('');
    const passwordConfirm = readlineSync.question('password confirm: ', { hideEchoBack: true, mask: '*' });
    console.log('');

    if (password != passwordConfirm) {
      console.log('비밀번호가 일치하지 않습니다.');
      process.exit(1);
    }
    await keytar.setPassword('lms-console', "username", username);
    await keytar.setPassword('lms-console', "password", password);
    console.log('로그인 정보가 저장되었습니다.');
  }

  if (lms.config.get("autologin")) {
    const username = await keytar.getPassword('lms-console', "username");
    const password = await keytar.getPassword('lms-console', "password");
    await lms.login(username, password);
  }

  async function userPrompt() {
    try {
      const loggedIn = await lms.isLoggedIn();
      const cmd = readlineSync.question(`${(loggedIn) ? lms.studentNumber : "kulms"} > `);
      const [command, ...args] = cmd.split(' ');
      if (command == "exit") process.exit(0);
      const script = require(path.join(__dirname, 'commands', `${command}.js`));
      await script.execute(lms, args);
      await userPrompt();
    } catch (e) {
      console.log("[ERROR]: " + e.message);
      await userPrompt();
    }
  }
  await userPrompt();
    
}

main();

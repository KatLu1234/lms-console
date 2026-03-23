#!/usr/bin/env node

require('dotenv').config();
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const readline = require('readline');
const readlineSync = require('readline-sync');
const keytar = require('keytar');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

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
  }

  async requestLearningXApi(method, path, params = {}) {

      
  }

}

async function main() {
  const lms = new LMSConsole();
  await lms.init();

  console.log('=== KULMS Console ===');
  console.log('');
  console.log('간단한 사용방법: login -> submit [강의 코드] [과제 제출 코드] [과제 제출 파일] -> exit');
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

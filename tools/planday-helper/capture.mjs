import puppeteer from 'puppeteer-core';
import { access } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import { directory, save, settings } from './settings.mjs';
import { currentWeek, resourceFor, snapshot } from './week.mjs';

function scheduleUrl(config, week) {
  const url = new URL('/schedule/' + config.department + '/board/employees', config.origin);
  url.search = new URLSearchParams({startDate:week.from, endDate:week.to});
  return url.href;
}
export class WeekBrowser {
  async open(config) {
    if (this.browser?.connected && this.config.origin === config.origin && this.config.department === config.department) return;
    await this.browser?.close();
    this.config = config;
    this.browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM || '/usr/bin/chromium',
      userDataDir: directory + '/browser', headless: true, pipe: true,
      defaultViewport: {width:1400,height:900}, args:['--lang=de-DE']
    });
    this.page = (await this.browser.pages())[0] || await this.browser.newPage();
    await this.page.emulateTimezone('Europe/Berlin');
  }

  // Observe only data loaded by the normal web page for the authorized week.
  async observe(config, week, interactive, navigate, timeout) {
    await this.open(config);
    const page = this.page;
    const parts = {};
    const target = new URL(scheduleUrl(config,week));
    const onSchedule = () => {
      const current = new URL(page.url());
      return current.origin === target.origin && current.pathname === target.pathname;
    };
    const receive = async response => {
      try {
        const field = resourceFor(response.url(), config.department, week);
        if (!field || !response.ok() || !onSchedule()) return;
        const data = await response.json();
        if (Array.isArray(data[field])) parts[field] = data[field];
      } catch { /* A previous page may have been unloaded. */ }
    };
    page.on('response', receive);
    try {
      await navigate();
      const end = Date.now() + timeout;
      let redirected = false;
      while (Date.now() < end) {
        if (interactive && this.cancelLogin) return false;
        if (!redirected && new URL(page.url()).origin === config.origin && new URL(page.url()).pathname === '/page/home') {
          redirected = true;
          await page.goto(scheduleUrl(config,week),{waitUntil:'domcontentloaded',timeout:45000});
        }
        if (parts.shifts && (parts.employees || !parts.shifts.some(s => s.employee_id && !['Open','Draft'].includes(s.status)))) {
          if (!onSchedule()) throw Error('Unexpected schedule page.');
          if (interactive) {
            await save('portal.json',config);
          }
          await save('week.json',{...snapshot(parts.shifts,parts.employees || [],config.department,week),origin:config.origin});
          return true;
        }
        await pause(300);
      }
      throw Error('No current department week.');
    } finally { page.off('response',receive); }
  }

  async refresh() {
    if (this.busy || this.manual) return;
    this.busy = true;
    try {
      try { await access(directory+'/portal.json'); }
      catch (e) { if (e.code === 'ENOENT') return; throw e; }
      const config = await settings();
      const week = currentWeek();
      await this.observe(config, week, false, () => this.page.goto(scheduleUrl(config,week),{waitUntil:'domcontentloaded',timeout:40000}),45000);
    } catch { console.error('Current week unavailable. Check the Planday session.'); }
    finally { this.busy = false; }
  }

  async startLogin(portal, department) {
    if (this.manual || this.busy) throw Error('Der Browser ist belegt. Bitte in einer Minute erneut versuchen.');
    this.manual = true;
    this.cancelLogin = false;
    let config;
    this.done = false;
    this.loginError = false;
    try { config=await settings(portal,department); await this.open(config); }
    catch (e) { this.manual=false; throw e; }
    this.loginTask = this.observe(config,currentWeek(),true,
      () => this.page.goto(scheduleUrl(config,currentWeek()),{waitUntil:'domcontentloaded',timeout:45000}),12*60000)
      .then(ok=>{ this.done=ok; }).catch(()=>{this.loginError=true;});
  }

  async finishLogin() {
    this.cancelLogin=true;
    await this.loginTask;
    this.manual=false;
  }
}

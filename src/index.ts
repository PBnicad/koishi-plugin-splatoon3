import { Context, Schema, Session } from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import path from 'path'
import fs from 'fs'

export const name = 'splatoon3'
export const inject = ['puppeteer']

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  async function captureScreenshot(session: Session<never, never, Context>, url: string, filename: string, viewport: { width: number, height: number }, clip?: { x: number, y: number, width: number, height: number }) {
    const page = await ctx.puppeteer.page();
    await page.setViewport(viewport);

    // Set the language to Chinese
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9'
    });
    
    // 设置时区为东八区 (Asia/Shanghai)
    await page.emulateTimezone('Asia/Shanghai');
    
    await page.setExtraHTTPHeaders({
      'Accept-Charset': 'utf-8',
      'Content-Type': 'text/html; charset=utf-8'
    });

    // 打开目标 URL
    await page.goto(url, { waitUntil: 'networkidle0' });

    // 在页面的头部插入一个 meta 标签来指定字符集为 UTF-8
    await page.evaluate(() => {
      const existingMetaCharset = document.querySelector('meta[charset]');
      if (existingMetaCharset) {
        existingMetaCharset.setAttribute('charset', 'UTF-8');
      } else {
        const metaCharset = document.createElement('meta');
        metaCharset.setAttribute('charset', 'UTF-8');
        document.head.prepend(metaCharset);
      }
    });
  
    // 获取当前语言设置，并仅当需要时才更改语言
    const currentLanguage = await page.evaluate(() => {
      const languageSelector = document.querySelector('select.bg-transparent.text-zinc-300.cursor-pointer') as HTMLSelectElement;
      return languageSelector ? languageSelector.value : null;
    });
  
    // 如果当前语言不是简体中文，则更改语言
    if (currentLanguage !== 'zh-CN') {

      // 在尝试更改语言前发送消息
      await session.send('正在获取，请稍等...');

      await page.evaluate(() => {
        const languageSelector = document.querySelector('select.bg-transparent.text-zinc-300.cursor-pointer') as HTMLSelectElement;
        if (languageSelector) {
          languageSelector.value = 'zh-CN';
          languageSelector.dispatchEvent(new Event('change'));
        }
      });
  
      // 等待语言更改后的网络响应
      await page.waitForResponse(response =>
        response.url().includes('locale/zh-CN.json') && response.status() === 200
      );

      // 等待页面重新渲染
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    }

    // 现在页面已经是简体中文，继续执行截图操作

    const screenshotsDir = path.join(__dirname, 'screenshots');
    fs.mkdirSync(screenshotsDir, { recursive: true });

    const screenshotPath = path.join(screenshotsDir, filename);
    const screenshotOptions = clip ? { path: screenshotPath, clip } : { path: screenshotPath, fullPage: true };
    await page.screenshot(screenshotOptions);

    const imageBuffer = fs.readFileSync(screenshotPath);
    const imageBase64 = imageBuffer.toString('base64');
    const dataUri = 'data:image/png;base64,' + imageBase64;

    return `<image url="${dataUri}"/>`;
  }

  // 各命令的视口设置
  const mapViewport = { width: 1050, height: 800 };
  const salmonRunViewport = { width: 800, height: 600 };
  const challengesViewport = { width: 1200, height: 700 };
  const gearViewport = { width: 1100, height: 800 };
  const splatfestsViewport = { width: 1200, height: 900 };

  // “喷喷祭典”命令的视窗设置
  const splatfestsClip = {
    x: 0, // 您需要决定的 X 坐标
    y: 0, // 您需要决定的 Y 坐标
    width: 1200, // 您需要决定的宽度
    height: 950 // 您需要决定的高度
  };

  // “喷喷地图”命令
  ctx.command('喷喷地图', '获取Splatoon3地图界面截图')
    .action(async ({ session }) => {
      return captureScreenshot(session, 'https://splatoon3.ink/', 'splatoon3_map_screenshot.png', mapViewport);
    });

  // “喷喷打工”命令
  ctx.command('喷喷打工', '获取Splatoon3打工界面截图')
    .action(async ({ session }) => {
      return captureScreenshot(session, 'https://splatoon3.ink/salmonrun', 'splatoon3_salmonrun_screenshot.png', salmonRunViewport);
    });

  // “喷喷比赛”命令
  ctx.command('喷喷比赛', '获取Splatoon3比赛界面截图')
    .action(async ({ session }) => {
      return captureScreenshot(session, 'https://splatoon3.ink/challenges', 'splatoon3_challenges_screenshot.png', challengesViewport);
    });

  // “喷喷商店”命令
  ctx.command('喷喷商店', '获取Splatoon3商店界面截图')
    .action(async ({ session }) => {
      return captureScreenshot(session, 'https://splatoon3.ink/gear', 'splatoon3_gear_screenshot.png', gearViewport);
    });

  // “喷喷祭典”命令，这次传入 clip 参数
  ctx.command('喷喷祭典', '获取Splatoon3祭典界面截图')
    .action(async ({ session }) => {
      return captureScreenshot(session, 'https://splatoon3.ink/splatfests', 'splatoon3_splatfests_screenshot.png', splatfestsViewport, splatfestsClip);
    });
}

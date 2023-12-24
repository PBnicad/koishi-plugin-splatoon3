import { Context, Schema } from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import path from 'path'
import fs from 'fs'

export const name = 'splatoon3'
export const inject = ['puppeteer']

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // 定义一个函数来处理截图逻辑
  async function captureScreenshot(url: string, filename: string, viewport: { width: number, height: number }, clip?: { x: number, y: number, width: number, height: number }) {
    const page = await ctx.puppeteer.page();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle0' });
  
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
      return captureScreenshot('https://splatoon3.ink/', 'splatoon3_map_screenshot.png', mapViewport);
    });

  // “喷喷打工”命令
  ctx.command('喷喷打工', '获取Splatoon3打工界面截图')
    .action(async ({ session }) => {
      return captureScreenshot('https://splatoon3.ink/salmonrun', 'splatoon3_salmonrun_screenshot.png', salmonRunViewport);
    });

  // “喷喷比赛”命令
  ctx.command('喷喷比赛', '获取Splatoon3比赛界面截图')
    .action(async ({ session }) => {
      return captureScreenshot('https://splatoon3.ink/challenges', 'splatoon3_challenges_screenshot.png', challengesViewport);
    });

  // “喷喷商店”命令
  ctx.command('喷喷商店', '获取Splatoon3商店界面截图')
    .action(async ({ session }) => {
      return captureScreenshot('https://splatoon3.ink/gear', 'splatoon3_gear_screenshot.png', gearViewport);
    });

  // “喷喷祭典”命令，这次传入 clip 参数
  ctx.command('喷喷祭典', '获取Splatoon3祭典界面截图')
    .action(async ({ session }) => {
      return captureScreenshot('https://splatoon3.ink/splatfests', 'splatoon3_splatfests_screenshot.png', splatfestsViewport, splatfestsClip);
    });
}

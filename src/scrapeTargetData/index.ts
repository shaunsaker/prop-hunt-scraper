import * as puppeteer from 'puppeteer';

export interface TargetDataItem<T> {
  key: keyof T;
  selector: string;
  href?: boolean;
}

export const scrapeTargetData = async <T extends { href: string }>(
  page: puppeteer.Page,
  url: string,
  targetData: TargetDataItem<any>[], // FIXME: Type this correctly
): Promise<T> => {
  console.log(`Fetching data from ${url}`);
  await page.goto(url);
  const data = {} as T;

  await page.waitForSelector('#main', { timeout: 5000 });

  for await (const target of targetData) {
    const value = await page.$$eval(
      target.selector,
      elements =>
        elements.map(el => {
          return {
            text: el.textContent,
            href: el.getAttribute('href'),
          };
        })[0],
    );
    if (target.href) {
      data[target.key] = value.href;
    } else {
      data[target.key] = value
        ? value.text.trim().replace(/(\r\n|\n|\r)/gm, '')
        : '';
    }
  }

  data.href = url;

  return data;
};

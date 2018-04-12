require('dotenv').config();
const CORNER_STATS_SELECTOR = require('../css_selectors/corner_stats');
const helpers = require('../helpers/corner-stats-navigation');
// const TEAM = require('../helpers/teams');
const puppeteer = require('puppeteer');

loginCornerStats = function() {
  console.log('Logging in to Corner Stats');
  (async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.setViewport({
  	  width: 1280,
  	  height: 600
    });
    await page.goto(CORNER_STATS_SELECTOR.login_page);

    await page.click(CORNER_STATS_SELECTOR.login_box);
    await page.keyboard.type(process.env.CORNER_STATS_USERNAME);

    await page.click(CORNER_STATS_SELECTOR.login_password);
    await page.keyboard.type(process.env.CORNER_STATS_PASSWORD);

    await page.click(CORNER_STATS_SELECTOR.login_button);
    await page.waitForNavigation();

  })();
}

fixturesPage = function() {
  console.log('Navigating to fixtures page');
  (async () => {
    await page.goto(CORNER_STATS_SELECTOR.todays_fixtures);
  });

}

exports.fixtures = async function() {
  await loginCornerStats();
  await fixturesPage();
}

exports.closeBrowser = function() {
  (async () => {
    await browser.close();
  })();
}

exports.takeScreenshot = function(fileName) {
  (async () => {
    await page.screenshot({path: 'screenshots/' + fileName, fullPage: true});
  })();
}

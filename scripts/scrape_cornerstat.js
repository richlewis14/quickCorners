require('dotenv').config();
const args = process.argv.slice(2);
const CORNERSTAT_SELECTOR = require('../css_selectors/cornerstat');
const TEAM = require('../helpers/teams');
const puppeteer = require('puppeteer');
const fs = require('fs');
var redis = require('redis');


if(process.env.NODE_ENV == 'production') {
  var client = redis.createClient(process.env.REDISCLOUD_URL);
} else {
  var client = redis.createClient();
}


// Write to redis
function writeToRedis(data, team, key){
  return new Promise((resolve, reject) => {
    var hash_set = {};
    // This will just update the existing HashSet already created from previous scrape
    for(var i = 0; i < data.length; i++ ){
      hash_set[key + i] = data[i];
    }

    client.hmset(team['team_name'], hash_set, function (error, result) {
     if (error) {
       reject(error);
       return;
     }
     resolve(result);
    });

  });
}

var corners;
// var goals;

(async () => {

  // Initialise Browser
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  // Allow console log in page.evaluate
  page.on('console', console.log);
  await page.setViewport({
    width: 1280,
    height: 800
  });
  await page.goto(CORNERSTAT_SELECTOR.login_page);
  page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.waitFor(2000);

  await page.click(CORNERSTAT_SELECTOR.login_box);
  await page.keyboard.type(process.env.CORNERSTAT_USERNAME);

  await page.click(CORNERSTAT_SELECTOR.login_password);
  await page.keyboard.type(process.env.CORNERSTAT_PASSWORD);

  await Promise.all([
      page.click(CORNERSTAT_SELECTOR.login_button),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);

  await Promise.all([
      page.click(CORNERSTAT_SELECTOR.results_button),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);

  for (var i = 0; i < TEAM[args].length; i++) {

    console.log("Starting data scrape from cornerstat for " + TEAM[args][i]['team_name'] + ' matches');

    // Clear input of any text
    await page.evaluate(() => {
      document.getElementsByName("ttt1")[0].value = '';
    });

    await page.type('input[name=ttt1]', TEAM[args][i]['search_name']);
    await page.waitFor(2000);
    await page.click(CORNERSTAT_SELECTOR.search_team_ball);
    page.waitForNavigation({ waitUntil: 'networkidle0' })
    await page.waitFor(3000);

    await page.select('#select_team1', TEAM[args][i]['id']);
    await page.click(CORNERSTAT_SELECTOR.search_team_ball);
    page.waitForNavigation({ waitUntil: 'networkidle0' })
    await page.waitFor(3000);

    await page.click("label > input[value='HOME']");
    page.waitForNavigation({ waitUntil: 'networkidle0' })
    await page.waitFor(2000);

    var league = TEAM[args][i]['league'];

    /////////
    // 37HTCW
    ////////
    // Extract First Half Corners Won Between 37-HT (thirty_seven_to_htw_home) for Home Matches

    corners = await page.evaluate((league) => {
    let array = [];
    // ES6 spread operator, Returns Node list and then convert to stringified array
    //array maps to following keys = ['date', 'home_team', 'away_team', 'ht_corners', 'ft_corners', 'thirty_seven_to_ht', 'eighty_to_ft', 'r3', 'r5', 'r7', 'r9', 'goals', 'order_corners', 'league'];
    // Loop from 1 which is used for selecting nth child

        for (var i = 1; i < 20; i++){
          let divs = [...document.querySelectorAll('#div_table_home > table > tbody > tr:nth-child(' + i +')' + '> td')];
          let values = divs.map((div) => div.innerText.trim());

          // last item in array
          if(values.slice(-1)[0] === league) {
            // data extracted looks like 5 - 1, so need to grab first letter of string
            array.push(values[5].charAt(0));
          }
        }

        return array;

      }, league);

    // Write to Redis
    writeToRedis(corners, TEAM[args][i], 'thirty_seven_to_htw_home');

  /////////
  // 37HTCC
  ////////
  // Extract First Half Corners Conceded Between 37-HT (thirty_seven_to_htc_home) for Home Matches

  corners = await page.evaluate((league) => {
  let array = [];
  // ES6 spread operator, Returns Node list and then convert to stringified array
  //array maps to following keys = ['date', 'home_team', 'away_team', 'ht_corners', 'ft_corners', 'thirty_seven_to_ht', 'eighty_to_ft', 'r3', 'r5', 'r7', 'r9', 'goals', 'order_corners', 'league'];
  // Loop from 1 which is used for selecting nth child

    for (var i = 1; i < 20; i++){
      let divs = [...document.querySelectorAll('#div_table_home > table > tbody > tr:nth-child(' + i +')' + '> td')];
      let values = divs.map((div) => div.innerText.trim());

      // last item in array
      if(values.slice(-1)[0] === league) {
        // data extracted looks like 5 - 1, so need to grab last letter of string
        array.push(values[5].charAt(4));
      }
    }

    return array;

  }, league);

  // Write to Redis
  writeToRedis(corners, TEAM[args][i], 'thirty_seven_to_htc_home');

  await page.waitFor(2000);
} // end loop
  client.quit();
  await browser.close();
})();

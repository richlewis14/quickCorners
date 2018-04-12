require('dotenv').config();
const args = process.argv.slice(2);
const CORNER_STATS_SELECTOR = require('../css_selectors/corner_stats');
const helpers = require('../helpers/corner-stats-navigation');
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
    // Set Team Name and League
    hash_set['team_name'] = team['team_name'];
    hash_set['league'] = team['league'];
    hash_set['friendly_name'] = team['friendly_name'];
    // Set data attributes
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

function readFromRedis(team){
  return new Promise((resolve, reject) => {
    client.hgetall(team['team_name'], function (error, result) {
     if (error) {
       reject(error);
       return;
     }
     console.log("Redis store for " + team['team_name'] + " equals");
     console.log(result);
     resolve(result);
    });
  });
}

var corners;
// var goals;

// Get Date - Used later on
var dateObj = new Date();
var month = ('0' + (dateObj.getUTCMonth() + 1)).slice(-2); // months from 1-12
var day = ('0' + dateObj.getUTCDate()).slice(-2);
var year = dateObj.getUTCFullYear().toString();

(async () => {

  // Initialise Browser
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 800
  });
  await page.goto(CORNER_STATS_SELECTOR.login_page);

  await page.click(CORNER_STATS_SELECTOR.login_box);
  await page.keyboard.type(process.env.CORNER_STATS_USERNAME);

  await page.click(CORNER_STATS_SELECTOR.login_password);
  await page.keyboard.type(process.env.CORNER_STATS_PASSWORD);

  await page.click(CORNER_STATS_SELECTOR.login_button);
  await page.waitForNavigation();

  // Go To Team URL
  for (var i = 0; i < TEAM[args].length; i++) {
    console.log("Starting data scrape processing for " + TEAM[args][i]['team_name'] + ' home matches');
    await page.goto(TEAM[args][i]['url']);
    await page.waitFor(2000);

  // Select Home Team (so click away team)
  await page.click("#guest_game_check_box > input[type='checkbox']");

  // Select Tournaments

  // Remove Cups
  if (await page.$('#tourn_group2') !== null) await page.click("#tourn_group2");
  //else console.log('Cups option not available for ' + TEAM[args][i]['team_name']);

  // Remove International (Not all clubs have this so conditional needed)
  if (await page.$('#tourn_group3') !== null) await page.click("#tourn_group3");
  //else console.log('International Tournament option not available for ' + TEAM[args][i]['team_name']);

  // Remove Other
  if (await page.$('#tourn_group4') !== null) await page.click("#tourn_group4");
  //else console.log('Other option not available for ' + TEAM[args][i]['team_name']);

  // Set a Date to (this prevents future fixtures coming up with ?)
  await page.select("select[name=date_end_day]", day);
  await page.select("select[name=date_end_month]", month);
  await page.select("select[name=date_end_year]", year);
  await page.waitFor(2000);

  // Select 1st Half corners
  await page.select('#corners1 > select', '1h');
  await page.waitFor(3000);

  /////////
  // FHCW
  ////////
  // Extract First Half Corners Won (FHCW) for Home Matches
  corners = await page.evaluate(() => {
    // ES6 spread operator, Returns Node list and then convert to stringified array
    let divs = [...document.querySelectorAll('#table_corners td.team_1_corners_quantity.td_center > a > b')];
    return divs.map((div) => div.innerText);
  });
  // Write to Redis
  writeToRedis(corners, TEAM[args][i], 'fhcw_home');

  ///////
  // FHCC
  ///////
  // Extract First Half Corners Conceded (FHCC) for Home Matches
  corners = await page.evaluate(() => {
    // ES6 spread operator, Returns Node list and then convert to stringified array
    let divs = [...document.querySelectorAll('#table_corners td.team_2_corners_quantity.td_center > a > b')];
    return divs.map((div) => div.innerText);
  });
  // Write to Redis
  writeToRedis(corners, TEAM[args][i], 'fhcc_home');

  // Select 2nd Half corners
  await page.select('#corners1 > select', '2h');
  await page.waitFor(3000);

  ////////
  // 2HCW
  ///////
  // Extract 2nd Half Corners Won (SHCW) for Home Matches
  corners = await page.evaluate(() => {
    // ES6 spread operator, Returns Node list and then convert to stringified array
    let divs = [...document.querySelectorAll('#table_corners td.team_1_corners_quantity.td_center > a > b')];
    return divs.map((div) => div.innerText);
  });
  // Write to Redis
  writeToRedis(corners, TEAM[args][i], 'shcw_home');

  ////////
  // 2HCC
  ///////
  // Extract 2nd Half Corners Conceded (SHCC) for Home Matches
  corners = await page.evaluate(() => {
    // ES6 spread operator, Returns Node list and then convert to stringified array
    let divs = [...document.querySelectorAll('#table_corners td.team_2_corners_quantity.td_center > a > b')];
    return divs.map((div) => div.innerText);
  });
  // Write to Redis
  writeToRedis(corners, TEAM[args][i], 'shcc_home');

  // Get Away stats
  // Select Away Team
  await page.click("#guest_game_check_box > input[type='checkbox']");
  // Remove Home Team
  await page.click("#home_game_check_box > input[type='checkbox']");

  // Select 1st Half corners
  await page.select('#corners1 > select', '1h');
  await page.waitFor(3000);

  /////////
  // FHCW
  ////////
  // Extract First Half Corners Won (FHCW) for Away Matches
  corners = await page.evaluate(() => {
    // ES6 spread operator, Returns Node list and then convert to stringified array
    let divs = [...document.querySelectorAll('#table_corners td.team_2_corners_quantity.td_center > a > b')];
    return divs.map((div) => div.innerText);
  });

  // Write to Redis
  writeToRedis(corners, TEAM[args][i], 'fhcw_away');

  ///////
  // FHCC
  ///////
  // Extract First Half Corners Conceded (FHCC) for Away Matches
  corners = await page.evaluate(() => {
    // ES6 spread operator, Returns Node list and then convert to stringified array
    let divs = [...document.querySelectorAll('#table_corners td.team_1_corners_quantity.td_center > a > b')];
    return divs.map((div) => div.innerText);
  });

  // Write to Redis
  writeToRedis(corners, TEAM[args][i], 'fhcc_away');

  // Select 2nd Half corners
  await page.select('#corners1 > select', '2h');
  await page.waitFor(3000);

  ////////
  // 2HCW
  ///////
  // Extract 2nd Half Corners Won (2HCW) for Away Matches
  corners = await page.evaluate(() => {
    // ES6 spread operator, Returns Node list and then convert to stringified array
    let divs = [...document.querySelectorAll('#table_corners td.team_2_corners_quantity.td_center > a > b')];
    return divs.map((div) => div.innerText);
  });
  // Write to Redis
  writeToRedis(corners, TEAM[args][i], 'shcw_away');

  ////////
  // 2HCC
  ///////
  // Extract 2nd Half Corners Conceded (2HCC) for Away Matches
  corners = await page.evaluate(() => {
    // ES6 spread operator, Returns Node list and then convert to stringified array
    let divs = [...document.querySelectorAll('#table_corners td.team_1_corners_quantity.td_center > a > b')];
    return divs.map((div) => div.innerText);
  });

  // Write to Redis
  writeToRedis(corners, TEAM[args][i], 'shcc_away');


  await page.waitFor(2000);
} // end loop
  client.quit();
  await browser.close();
})();

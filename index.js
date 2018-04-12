var express = require('express');
var app = express();
const TEAMS = require('./helpers/teams');
// redis
var redis = require('redis');

if(process.env.NODE_ENV == 'production') {
  var client = redis.createClient(process.env.REDISCLOUD_URL);
} else {
  var client = redis.createClient();
}

var port = process.env.PORT || 4000;

var teams_array = [];
var team_data = [];

async function getTeamInfo(league_name){
  teams_array = [];
  team_data = [];
  for(var i = 0; i < TEAMS[league_name].length; i++){
    teams_array.push(TEAMS[league_name][i]['team_name']);
  }

  for(var i = 0; i < teams_array.length; i++) {
    var data = await readFromRedis(teams_array[i]);
    team_data.push(data);

  }
}

function readFromRedis(team_name){
  return new Promise((resolve, reject) => {
    client.hgetall(team_name, function (error, result) {
     if (error) {
       reject(error);
       return;
     }
     resolve(result);
    });
  });
}

app.use(express.static('public'))
// set the view engine to ejs
app.set('view engine', 'ejs')

app.get('/', async function (req, res) {
  res.render('home');
});

app.get('/premier_league', async function (req, res) {
  // render `home.ejs` with the list of teams
  await getTeamInfo('premier_league');
  const teams = team_data;
  res.render('premier_league', { teams: teams });
});

app.get('/efl_championship', async function (req, res) {
  await getTeamInfo('efl_championship');
  const teams = team_data;
  res.render('efl_championship', { teams: teams });
});

app.get('/efl_one', async function (req, res) {
  await getTeamInfo('efl_one');
  const teams = team_data;
  res.render('efl_one', { teams: teams });
});

app.get('/efl_two', async function (req, res) {
  await getTeamInfo('efl_two');
  const teams = team_data;
  res.render('efl_two', { teams: teams });
});

app.get('/serie_a', async function (req, res) {
  await getTeamInfo('serie_a');
  const teams = team_data;
  res.render('serie_a', { teams: teams });
});

app.get('/serie_b', async function (req, res) {
  await getTeamInfo('serie_b');
  const teams = team_data;
  res.render('serie_b', { teams: teams });
});

app.get('/bundesliga', async function (req, res) {
  await getTeamInfo('bundesliga');
  const teams = team_data;
  res.render('bundesliga', { teams: teams });
});

app.get('/bundesliga_2', async function (req, res) {
  await getTeamInfo('bundesliga_2');
  const teams = team_data;
  res.render('bundesliga_2', { teams: teams });
});

app.listen(port, function () {
  console.log('Quick Corner Check listening on port ' + port);
});

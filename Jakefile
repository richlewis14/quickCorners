// Runs midnight every night - takes 35 mins
desc('Data Scraping for England Leagues');
  task('scrape-data-england', {async: true}, function () {

  var cmds = [
    'node ./scripts/scrape_corners.js premier_league',
    'node ./scripts/scrape_corners.js efl_championship',
    'node ./scripts/scrape_corners.js efl_one',
    'node ./scripts/scrape_corners.js efl_two'
  ];

  jake.exec(cmds, {printStdout: true}, function () {
    console.log('Data scrape for england leagues complete');
    complete();

  });
});

// Runs 1am every night - takes 10 mins
desc('Data Scraping for German Leagues');
  task('scrape-data-germany', {async: true}, function () {

  var cmds = [
    'node ./scripts/scrape_corners.js bundesliga',
    'node ./scripts/scrape_corners.js bundesliga_2'
  ];

  jake.exec(cmds, {printStdout: true}, function () {
    console.log('Data scrape for german leagues complete');
    complete();

  });
});

// Runs 1:30am every night - takes 10 mins
desc('Data Scraping for french Leagues');
  task('scrape-data-france', {async: true}, function () {

  var cmds = [
    'node ./scripts/scrape_corners.js ligue_1',
    'node ./scripts/scrape_corners.js ligue_2'
  ];

  jake.exec(cmds, {printStdout: true}, function () {
    console.log('Data scrape for french leagues complete');
    complete();

  });
});

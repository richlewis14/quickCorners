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

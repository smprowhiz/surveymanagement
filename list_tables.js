const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('survey-dev.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Available tables:');
    tables.forEach(t => console.log('- ' + t.name));
  }
  db.close();
});

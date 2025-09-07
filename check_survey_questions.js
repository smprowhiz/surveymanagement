const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('survey-dev.db');

db.all('PRAGMA table_info(survey_questions)', (err, cols) => {
  if (err) {
    console.error(err);
  } else {
    console.log('survey_questions columns:');
    cols.forEach(col => console.log(`- ${col.name} (${col.type})`));
  }
  
  console.log('\nSample survey_questions data:');
  db.all('SELECT * FROM survey_questions LIMIT 3', (err2, rows) => {
    if (err2) {
      console.error(err2);
    } else {
      console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
  });
});

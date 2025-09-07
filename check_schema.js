const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('survey-dev.db');

console.log('=== DATABASE SCHEMA CHECK ===\n');

db.all('PRAGMA table_info(questions)', (err, cols) => {
  if (err) {
    console.error('Questions table error:', err);
  } else {
    console.log('Questions table columns:');
    cols.forEach(col => console.log(`- ${col.name} (${col.type})`));
  }
  
  console.log('\nCategories table columns:');
  db.all('PRAGMA table_info(categories)', (err2, cols2) => {
    if (err2) {
      console.error('Categories table error:', err2);
    } else {
      cols2.forEach(col => console.log(`- ${col.name} (${col.type})`));
    }
    
    console.log('\nSurvey_responses table columns:');
    db.all('PRAGMA table_info(survey_responses)', (err3, cols3) => {
      if (err3) {
        console.error('Survey_responses table error:', err3);
      } else {
        cols3.forEach(col => console.log(`- ${col.name} (${col.type})`));
      }
      
      console.log('\nTesting simple response query...');
      db.all('SELECT * FROM survey_responses LIMIT 3', (err4, rows) => {
        if (err4) {
          console.error('Sample query error:', err4);
        } else {
          console.log('Sample response data:');
          console.log(JSON.stringify(rows, null, 2));
        }
        db.close();
      });
    });
  });
});

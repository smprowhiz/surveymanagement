const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('survey-dev.db');

// Drop the table and recreate it with the correct constraint
db.run('DROP TABLE IF EXISTS survey_rater_assignments', (err) => {
  if (err) {
    console.error('Error dropping table:', err);
    return;
  }
  
  db.run(`CREATE TABLE survey_rater_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    subject_employee_id INTEGER NOT NULL,
    rater_employee_id INTEGER NOT NULL,
    feedback_type TEXT CHECK(feedback_type IN ('self','manager','reportee','peer')) NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY(rater_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(survey_id, subject_employee_id, rater_employee_id, feedback_type)
  )`, (err) => {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }
    
    const now = new Date().toISOString();
    
    // Bob (id=2) gives self feedback
    db.run('INSERT INTO survey_rater_assignments (survey_id, subject_employee_id, rater_employee_id, feedback_type, created_at) VALUES (1, 2, 2, ?, ?)', ['self', now]);
    
    // Bob (id=2) gives manager feedback to his direct reports
    db.run('INSERT INTO survey_rater_assignments (survey_id, subject_employee_id, rater_employee_id, feedback_type, created_at) VALUES (1, 5, 2, ?, ?)', ['manager', now]); // Emma Wilson
    db.run('INSERT INTO survey_rater_assignments (survey_id, subject_employee_id, rater_employee_id, feedback_type, created_at) VALUES (1, 7, 2, ?, ?)', ['manager', now]); // Grace Lee
    
    // Emma (id=5) gives reportee feedback about Bob
    db.run('INSERT INTO survey_rater_assignments (survey_id, subject_employee_id, rater_employee_id, feedback_type, created_at) VALUES (1, 2, 5, ?, ?)', ['reportee', now]);
    
    // Frank (id=6) gives peer feedback about Bob  
    db.run('INSERT INTO survey_rater_assignments (survey_id, subject_employee_id, rater_employee_id, feedback_type, created_at) VALUES (1, 2, 6, ?, ?)', ['peer', now]);
    
    console.log('Table recreated and sample data inserted');
    db.close();
  });
});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('survey-dev.db');

db.all(`SELECT r.id as response_id,
               r.employee_email,
               r.feedback_type,
               r.subject_employee_id,
               q.question_text,
               r.response_text,
               rater.name as rater_name,
               rater.role as rater_role,
               subject.name as subject_name,
               subject.role as subject_role
        FROM survey_responses r
        JOIN survey_questions q ON r.question_id = q.id
        LEFT JOIN employees rater ON rater.email = r.employee_email
        LEFT JOIN employees subject ON subject.id = r.subject_employee_id
        WHERE r.survey_id = 1
        LIMIT 3`, 
        (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Enhanced Responses with Rater and Subject Info:');
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});

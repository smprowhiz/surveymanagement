const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('survey-dev.db');

async function updateHistoricalResponses() {
  console.log('Updating historical survey responses with subject_employee_id...');
  
  // For self feedback, the subject is the same as the rater
  await new Promise((resolve, reject) => {
    db.run(`UPDATE survey_responses 
            SET subject_employee_id = (
              SELECT e.id FROM employees e WHERE e.email = survey_responses.employee_email
            )
            WHERE feedback_type = 'self' AND subject_employee_id IS NULL`, 
    (err) => {
      if (err) reject(err);
      else {
        console.log(`Updated ${this.changes} self-feedback responses`);
        resolve();
      }
    });
  });

  // For manager feedback, we need to assign subjects based on reporting relationships
  // Let's create some logical assignments based on the existing employee structure
  
  // Get all employees and their details
  const employees = await new Promise((resolve, reject) => {
    db.all('SELECT id, name, email, role FROM employees ORDER BY id', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log('Available employees:', employees.map(e => `${e.name} (${e.role})`).join(', '));
  
  // Define logical manager-reportee relationships based on roles
  const managerAssignments = [
    // Bob Jones (Manager, id=2) manages developers and engineers at Acme
    { manager_email: 'bob@acme.com', subject_ids: [5, 7, 8, 9, 10] }, // Emma, Grace, Hank, Ivy, Jack
    
    // Alice Smith (CEO, id=1) manages other managers
    { manager_email: 'alice@acme.com', subject_ids: [2, 6] }, // Bob, Frank
    
    // Carol Lee (CEO at Globex, id=3) manages Globex staff
    { manager_email: 'carol@globex.com', subject_ids: [11, 12, 13, 14, 15] }, // Nina, Olivia, Ryan, Paul, Quinn
    
    // Frank Miller (Manager, id=6) might manage some analysts
    { manager_email: 'frank@acme.com', subject_ids: [9, 10] }, // Ivy, Jack
    
    // Nina Torres (Manager at Globex, id=11) manages some Globex employees
    { manager_email: 'nina@globex.com', subject_ids: [12, 13, 14, 15] } // Olivia, Ryan, Paul, Quinn
  ];
  
  // Update manager feedback responses
  for (const assignment of managerAssignments) {
    for (const subjectId of assignment.subject_ids) {
      await new Promise((resolve, reject) => {
        db.run(`UPDATE survey_responses 
                SET subject_employee_id = ?
                WHERE employee_email = ? 
                AND feedback_type = 'manager' 
                AND subject_employee_id IS NULL`, 
        [subjectId, assignment.manager_email], 
        (err) => {
          if (err) reject(err);
          else {
            if (this.changes > 0) {
              console.log(`Assigned manager feedback: ${assignment.manager_email} -> employee ${subjectId}`);
            }
            resolve();
          }
        });
      });
    }
  }
  
  // For peer feedback, assign some cross-team relationships
  const peerAssignments = [
    // Engineers giving peer feedback to other engineers
    { peer_email: 'grace@acme.com', subject_ids: [7, 8] }, // Grace -> Hank
    { peer_email: 'hank@acme.com', subject_ids: [7] }, // Hank -> Grace
    { peer_email: 'olivia@globex.com', subject_ids: [12, 13] }, // Olivia -> Ryan
    { peer_email: 'ryan@globex.com', subject_ids: [12] }, // Ryan -> Olivia
    
    // Developers giving peer feedback
    { peer_email: 'emma@acme.com', subject_ids: [5] }, // Emma to herself or others
    
    // Analysts giving peer feedback  
    { peer_email: 'ivy@acme.com', subject_ids: [9, 10] }, // Ivy -> Jack
    { peer_email: 'jack@acme.com', subject_ids: [9] }, // Jack -> Ivy
    { peer_email: 'paul@globex.com', subject_ids: [14] } // Paul giving feedback
  ];
  
  // Update peer feedback responses
  for (const assignment of peerAssignments) {
    for (const subjectId of assignment.subject_ids) {
      await new Promise((resolve, reject) => {
        db.run(`UPDATE survey_responses 
                SET subject_employee_id = ?
                WHERE employee_email = ? 
                AND feedback_type = 'peer' 
                AND subject_employee_id IS NULL`, 
        [subjectId, assignment.peer_email], 
        (err) => {
          if (err) reject(err);
          else {
            if (this.changes > 0) {
              console.log(`Assigned peer feedback: ${assignment.peer_email} -> employee ${subjectId}`);
            }
            resolve();
          }
        });
      });
    }
  }
  
  // For reportee feedback (upward feedback), assign some relationships
  const reporteeAssignments = [
    // Direct reports giving feedback about their managers
    { reportee_email: 'emma@acme.com', manager_id: 2 }, // Emma -> Bob
    { reportee_email: 'grace@acme.com', manager_id: 2 }, // Grace -> Bob
    { reportee_email: 'hank@acme.com', manager_id: 2 }, // Hank -> Bob
    { reportee_email: 'ivy@acme.com', manager_id: 6 }, // Ivy -> Frank
    { reportee_email: 'jack@acme.com', manager_id: 6 }, // Jack -> Frank
    { reportee_email: 'bob@acme.com', manager_id: 1 }, // Bob -> Alice
    { reportee_email: 'frank@acme.com', manager_id: 1 }, // Frank -> Alice
    { reportee_email: 'olivia@globex.com', manager_id: 11 }, // Olivia -> Nina
    { reportee_email: 'ryan@globex.com', manager_id: 11 }, // Ryan -> Nina
    { reportee_email: 'paul@globex.com', manager_id: 3 }, // Paul -> Carol
    { reportee_email: 'quinn@globex.com', manager_id: 3 } // Quinn -> Carol
  ];
  
  // Update reportee feedback responses
  for (const assignment of reporteeAssignments) {
    await new Promise((resolve, reject) => {
      db.run(`UPDATE survey_responses 
              SET subject_employee_id = ?
              WHERE employee_email = ? 
              AND feedback_type = 'reportee' 
              AND subject_employee_id IS NULL`, 
      [assignment.manager_id, assignment.reportee_email], 
      (err) => {
        if (err) reject(err);
        else {
          if (this.changes > 0) {
            console.log(`Assigned reportee feedback: ${assignment.reportee_email} -> manager ${assignment.manager_id}`);
          }
          resolve();
        }
      });
    });
  }
  
  // Check final results
  const finalCount = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM survey_responses WHERE subject_employee_id IS NOT NULL', (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
  
  const totalCount = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM survey_responses', (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
  
  console.log(`\nUpdate complete!`);
  console.log(`Responses with subject_employee_id: ${finalCount}/${totalCount}`);
  
  db.close();
}

updateHistoricalResponses().catch(console.error);

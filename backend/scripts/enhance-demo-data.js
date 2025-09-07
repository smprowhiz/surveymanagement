#!/usr/bin/env node
// Enhance the demo survey with more realistic data for better report testing

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function queryAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

function queryGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null)));
  });
}

function queryRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Realistic response patterns based on feedback type
const responsePatterns = {
  self: {
    // Self-ratings tend to be more moderate, avoiding extremes
    scoreDistribution: [0.1, 0.15, 0.4, 0.25, 0.1], // positions 1-5
    textResponses: [
      "I believe I have strong technical skills and am working on improving my communication with stakeholders.",
      "My goal is to become more strategic in my approach while maintaining my hands-on involvement.",
      "I feel confident in my ability to deliver results, though I recognize I need to develop my team leadership skills.",
      "I'm focused on building stronger relationships across the organization and improving my executive presence."
    ]
  },
  manager: {
    // Managers often provide balanced but constructive feedback
    scoreDistribution: [0.05, 0.2, 0.35, 0.3, 0.1],
    textResponses: [
      "Shows strong technical competence and consistently delivers quality results. Could benefit from developing more strategic thinking.",
      "Demonstrates good leadership potential but needs to work on delegation and empowering team members.",
      "Excellent problem-solving skills and attention to detail. Should focus on building broader organizational relationships.",
      "Strong performer who would benefit from taking on more complex challenges and developing others."
    ]
  },
  peer: {
    // Peers often focus on collaboration and day-to-day interactions
    scoreDistribution: [0.08, 0.17, 0.35, 0.28, 0.12],
    textResponses: [
      "Great to work with - always willing to help and collaborate. Could be more proactive in sharing knowledge.",
      "Strong technical contributor who brings good ideas to the team. Sometimes hesitant to speak up in larger meetings.",
      "Reliable team player with good problem-solving skills. Would like to see more initiative in driving cross-team projects.",
      "Excellent colleague who maintains positive relationships. Could benefit from taking more leadership in team discussions."
    ]
  },
  reportee: {
    // Direct reports often rate leadership and support highly
    scoreDistribution: [0.03, 0.12, 0.25, 0.4, 0.2],
    textResponses: [
      "Provides clear direction and good support for my development. I appreciate the regular feedback and coaching.",
      "Great manager who trusts me to do my job while being available when I need guidance. Very approachable.",
      "Helps me understand the bigger picture and how my work contributes to team goals. Could provide more stretch opportunities.",
      "Supportive leadership style that encourages growth. Would benefit from more structured career development discussions."
    ]
  }
};

async function enhanceSurveyData(db, surveyId) {
  console.log(`Enhancing data for survey ${surveyId}...`);
  
  // Clear existing responses
  await queryRun(db, 'DELETE FROM survey_responses WHERE survey_id = ?', [surveyId]);
  
  // Get survey questions and participants
  const questions = await queryAll(db, `
    SELECT id, feedback_type, question_type, category_name, position 
    FROM survey_questions 
    WHERE survey_id = ? 
    ORDER BY feedback_type, position
  `, [surveyId]);
  
  const participants = await queryAll(db, `
    SELECT sp.feedback_type, sp.employee_id, e.email, e.name
    FROM survey_participants sp
    JOIN employees e ON sp.employee_id = e.id
    WHERE sp.survey_id = ?
  `, [surveyId]);
  
  const questionOptions = await queryAll(db, `
    SELECT sqo.survey_question_id, sqo.option_text, sqo.position
    FROM survey_question_options sqo
    JOIN survey_questions sq ON sqo.survey_question_id = sq.id
    WHERE sq.survey_id = ?
    ORDER BY sqo.position
  `, [surveyId]);
  
  // Group options by question
  const optionsByQuestion = {};
  questionOptions.forEach(opt => {
    if (!optionsByQuestion[opt.survey_question_id]) {
      optionsByQuestion[opt.survey_question_id] = [];
    }
    optionsByQuestion[opt.survey_question_id].push(opt);
  });
  
  const now = new Date().toISOString();
  
  // Generate responses for each participant
  for (const participant of participants) {
    const pattern = responsePatterns[participant.feedback_type];
    const questionsForType = questions.filter(q => q.feedback_type === participant.feedback_type);
    
    for (const question of questionsForType) {
      if (question.question_type === 'mcq') {
        // Generate MCQ response based on distribution pattern
        const options = optionsByQuestion[question.id] || [];
        if (options.length > 0) {
          const selectedPosition = selectRandomPosition(pattern.scoreDistribution);
          const selectedOption = options.find(opt => opt.position === selectedPosition) || options[0];
          
          await queryRun(db, `
            INSERT INTO survey_responses (survey_id, feedback_type, question_id, response_text, employee_email, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [surveyId, participant.feedback_type, question.id, selectedOption.option_text, participant.email, now]);
        }
      } else if (question.question_type === 'text') {
        // Generate text response
        const textOptions = pattern.textResponses;
        const selectedText = textOptions[Math.floor(Math.random() * textOptions.length)];
        
        await queryRun(db, `
          INSERT INTO survey_responses (survey_id, feedback_type, question_id, response_text, employee_email, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [surveyId, participant.feedback_type, question.id, selectedText, participant.email, now]);
      }
    }
  }
  
  console.log('Survey data enhancement completed!');
}

function selectRandomPosition(distribution) {
  const rand = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < distribution.length; i++) {
    cumulative += distribution[i];
    if (rand <= cumulative) {
      return i + 1; // positions are 1-based
    }
  }
  
  return distribution.length; // fallback to highest position
}

(async () => {
  try {
    const backendDir = path.resolve(__dirname, '..');
    const dbPath = path.join(backendDir, 'survey.db');
    const db = new sqlite3.Database(dbPath);
    
    const survey = await queryGet(db, 'SELECT id FROM surveys ORDER BY id DESC LIMIT 1');
    if (!survey) {
      console.error('No survey found');
      process.exit(1);
    }
    
    await enhanceSurveyData(db, survey.id);
    db.close();
    
  } catch (error) {
    console.error('Enhancement failed:', error.message);
    process.exit(1);
  }
})();

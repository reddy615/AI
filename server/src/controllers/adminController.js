const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Question = require('../models/Question');
const AIQuestion = require('../models/AIQuestion');
const Attempt = require('../models/Attempt');
const CodingAttempt = require('../models/CodingAttempt');
const MockInterviewSession = require('../models/MockInterviewSession');
const Assessment = require('../models/Assessment');
const { sendError } = require('../utils/apiResponse');
const { getLeaderboard } = require('../services/gamificationService');
const { sendEmail } = require('../utils/sendEmail');
const {
  LOCAL_USERS,
  findLocalUserById,
  updateLocalUser,
} = require('../config/localUsers');
const {
  ASSESSMENT_ACCESS_KEYS,
  normalizeAssessmentAccess,
  mergeAssessmentAccess,
  hasAnyAssessmentAccess,
} = require('../utils/assessmentAccess');
const pdfParse = require('pdf-parse');
/**
 * Parse plain text from PDF into question objects.
 * This parser is intentionally conservative and looks for a common
 * pattern used in exported question PDFs:
 *
 * 1. Question text
 * A. Option A
 * B. Option B
 * C. Option C
 * D. Option D
 * Answer: A
 */
function parseQuestionsFromText(text) {
  if (!text || !String(text).trim()) return [];

  const lines = text.split('\n').map((line) => line.trim());
  const questions = [];
  let currentSection = 'General';
  let currentQuestion = null;
  let parsingState = 'none'; // 'none', 'question_text', 'options', 'explanation'

  const sectionRegexes = [
    { name: 'Advanced Aptitude', regex: /advanced\s*aptitude/i },
    { name: 'Verbal Ability', regex: /verbal\s*ability|verbal/i },
    { name: 'Aptitude', regex: /quantitative\s*aptitude|aptitude/i },
    { name: 'Reasoning', regex: /logical\s*reasoning|reasoning/i },
    { name: 'Coding Questions', regex: /coding\s*questions|coding/i },
  ];

  const questionStartRegex = /^\s*(?:Q|Question)?\s*[-.]?\s*(\d+)\s*[\.)\-:]\s*(.*)$/i;
  const answerRegex = /^\s*(?:Answer|Ans)\s*(?:is|[:\-]?)\s*(?:Option\s*)?\(?([A-D])\)?(?:\s+|$|\.|\))/i;
  const explanationRegex = /^\s*(?:Explanation|Exp)\s*[:\-]\s*(.*)$/i;

  function extractOptionsFromLine(line) {
    const matches = [];
    const regex = /(?:^|\s+)\(?([A-D])\)?\s*[\.)\-:]\s*(.*?)(?=\s+\(?[A-D]\)?\s*[\.)\-:]|$)/gi;
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(line)) !== null) {
      matches.push({
        letter: match[1].toUpperCase(),
        text: match[2].trim(),
      });
    }
    return matches;
  }

  const commitCurrentQuestion = () => {
    if (!currentQuestion) return;

    const isCodingSection = currentQuestion.topic === 'Coding Questions' || currentQuestion.topic === 'Coding';
    const hasNoOptions = currentQuestion.options.length === 0;
    const isCodingText = /write\s+(?:a\s+)?(?:program|function|code|algorithm|script|method)/i.test(currentQuestion.text);

    if (isCodingSection || (hasNoOptions && isCodingText)) {
      currentQuestion.type = 'coding';
      currentQuestion.topic = 'Coding';
      currentQuestion.category = 'Coding';
      currentQuestion.options = [];
      currentQuestion.correctAnswer = null;
    } else {
      currentQuestion.type = 'mcq';
      currentQuestion.options = currentQuestion.options.map((opt) => opt.trim()).filter(Boolean);
      if (currentQuestion.options.length > 0) {
        while (currentQuestion.options.length < 4) {
          currentQuestion.options.push('');
        }
      }
    }

    currentQuestion.text = currentQuestion.text.trim();
    currentQuestion.question = currentQuestion.text;
    currentQuestion.explanation = currentQuestion.explanation.trim();

    questions.push(currentQuestion);
    currentQuestion = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Skip page numbers and headers
    if (/^\s*Page\s*\d+\s*(?:of\s*\d+)?\s*$/i.test(line)) {
      continue;
    }

    // 1. Check for Section Heading
    let sectionMatched = false;
    for (const sec of sectionRegexes) {
      if (sec.regex.test(line) && line.length < 40) {
        commitCurrentQuestion();
        currentSection = sec.name;
        console.log("CURRENT SECTION:", currentSection);
        sectionMatched = true;
        parsingState = 'none';
        break;
      }
    }
    if (sectionMatched) continue;

    // 2. Check for Question Start
    const qMatch = line.match(questionStartRegex);
    if (qMatch) {
      const qNum = parseInt(qMatch[1], 10);
      if (qNum > 0 && qNum <= 150) {
        commitCurrentQuestion();
        currentQuestion = {
          text: qMatch[2],
          options: [],
          correctAnswer: 0,
          topic: currentSection,
          category: currentSection,
          difficulty: 'Medium',
          marks: 1,
          explanation: '',
        };
        parsingState = 'question_text';
        continue;
      }
    }

    // 3. Check for Options (single or inline)
    const optionsFound = extractOptionsFromLine(line);
    if (optionsFound.length > 0 && currentQuestion) {
      optionsFound.forEach((opt) => {
        currentQuestion.options.push(opt.text);
      });
      parsingState = 'options';
      continue;
    }

    // 4. Check for Answer
    const ansMatch = line.match(answerRegex);
    if (ansMatch && currentQuestion) {
      const ansLetter = ansMatch[1].toUpperCase();
      const letterCode = ansLetter.charCodeAt(0) - 65;
      currentQuestion.correctAnswer = letterCode;
      parsingState = 'answer';
      continue;
    }

    // 5. Check for Explanation
    const expMatch = line.match(explanationRegex);
    if (expMatch && currentQuestion) {
      currentQuestion.explanation = expMatch[1];
      parsingState = 'explanation';
      continue;
    }

    // 6. Append to current state
    if (currentQuestion) {
      if (parsingState === 'question_text') {
        currentQuestion.text += '\n' + line;
      } else if (parsingState === 'options' && currentQuestion.options.length > 0) {
        currentQuestion.options[currentQuestion.options.length - 1] += ' ' + line;
      } else if (parsingState === 'explanation') {
        currentQuestion.explanation += '\n' + line;
      }
    } else {
      console.log("SKIPPED LINE (no active question):", line);
    }
  }

  commitCurrentQuestion();

  console.log("TOTAL QUESTIONS PARSED:", questions.length);
  return questions;
}

const emailReminderCooldownMap = new Map();
const EMAIL_REMINDER_COOLDOWN_MS = 60 * 1000;

function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM;
}

function getReminderCooldownKey(userId) {
  return `resume-reminder:${String(userId)}`;
}

function canSendReminder(userId) {
  const lastSent = emailReminderCooldownMap.get(getReminderCooldownKey(userId));
  return !lastSent || Date.now() - lastSent >= EMAIL_REMINDER_COOLDOWN_MS;
}

function recordReminderSent(userId) {
  emailReminderCooldownMap.set(getReminderCooldownKey(userId), Date.now());
}

async function sendResumeReminderEmail(user) {
  console.log('[EMAIL] Attempting to send resume reminder...');
  console.log('[EMAIL] RESEND_API_KEY_PRESENT:', Boolean(process.env.RESEND_API_KEY));
  console.log('[EMAIL] MAIL_FROM:', process.env.MAIL_FROM);
  console.log('[EMAIL] Recipient:', user.email);
  console.log('Preparing reminder email for:', user.email);
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111; line-height: 1.6; max-width: 600px; margin:0 auto; padding:24px; background:#f7fafc;">
      <table role="presentation" width="100%" style="background:#ffffff;border-radius:8px;padding:24px;border:1px solid #e6e9ee;">
        <tr>
          <td style="text-align:center;padding-bottom:12px;font-weight:600;color:#0f172a;font-size:18px;">AI Interview Team</td>
        </tr>
        <tr>
          <td style="padding:12px 0 8px;color:#0f172a;font-size:15px;">
            <p style="margin:0 0 12px;">Dear ${user.name || 'Candidate'},</p>
            <p style="margin:0 0 12px;color:#334155;">We hope you are doing well.</p>
            <p style="margin:0 0 12px;color:#334155;">We noticed that your resume has not yet been uploaded to the AI Interview Preparation Platform. Uploading your resume is an important step to unlock the full set of platform features and receive personalized interview preparation support.</p>
            <p style="margin:0 0 12px;color:#334155;">By uploading your resume, you will be able to:</p>
            <ul style="margin:0 0 12px; padding-left:18px; color:#334155;">
              <li>Receive AI-powered resume analysis and ATS insights</li>
              <li>Get personalized interview questions based on your profile</li>
              <li>Access skill-gap recommendations and improvement suggestions</li>
              <li>Track your interview readiness more effectively</li>
              <li>Improve your chances of standing out during placements and recruitment drives</li>
            </ul>
            <p style="margin:0 0 12px;color:#334155;">We kindly request you to upload your resume at your earliest convenience to continue making the most of the platform.</p>
            <p style="margin:0 0 12px;color:#334155;"><a href="${process.env.FRONTEND_BASE_URL || ''}" style="color:#1d4ed8;text-decoration:none;">Log in to your account</a> and upload your resume directly from the Resume section of the dashboard.</p>
            <p style="margin:0 0 12px;color:#334155;">If you face any issues while uploading, feel free to contact our support team.</p>
            <p style="margin:0 0 4px;color:#334155;">Thank you for being a part of the AI Interview Preparation Platform.</p>
            <p style="margin:0 0 4px;color:#334155;">Best Regards,<br/>AI Interview Team</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:12px;font-size:12px;color:#94a3b8;text-align:center;">This is an automated reminder from AI Interview Platform. If you've already uploaded your resume, please disregard this message.</td>
        </tr>
      </table>
    </div>
  `;

  const result = await sendEmail({
    to: user.email,
    subject: 'Reminder: Please upload your resume',
    html,
  });
  
  console.log('[EMAIL] Resume reminder sent successfully. Response:', result);
  console.log('Reminder email completed');
  return result;
}

// Helper functions for resume handling
function isDownloadRequest(req) {
  const value = String(req.query.download || '').toLowerCase();
  return value === '1' || value === 'true';
}

function resolveResumeContentType({ remoteContentType, storedMimeType, filename, resumeUrl }) {
  const remoteType = String(remoteContentType || '').toLowerCase();
  const storedType = String(storedMimeType || '').toLowerCase();
  const name = String(filename || resumeUrl || '').toLowerCase();

  if (storedType) {
    return storedMimeType;
  }

  if (name.endsWith('.pdf')) {
    return 'application/pdf';
  }

  if (name.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  if (name.endsWith('.doc')) {
    return 'application/msword';
  }

  return remoteType || 'application/octet-stream';
}

function resolveResumeFilename(filename, contentType) {
  let resolved = filename || 'Resume';
  try {
    if (!/\.[a-zA-Z0-9]+$/.test(resolved)) {
      const type = String(contentType || '').toLowerCase();
      if (type.includes('pdf')) resolved += '.pdf';
      else if (type.includes('officedocument.wordprocessingml.document')) resolved += '.docx';
      else if (type.includes('msword')) resolved += '.doc';
    }
  } catch (e) {}

  return resolved.replace(/"/g, '');
}

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function toCount(value) {
  return Number(value) || 0;
}

function buildAssessmentAccessSummaryFromUsers(users) {
  const assessments = ASSESSMENT_ACCESS_KEYS.reduce((summary, key) => {
    const usersWithAccess = users.filter(
      (user) => normalizeAssessmentAccess(user.assessmentAccess)[key]
    ).length;

    summary[key] = {
      usersWithAccess,
      active: usersWithAccess > 0,
    };
    return summary;
  }, {});

  return {
    totalUsers: users.length,
    assessments,
  };
}

async function buildAssessmentAccessSummary() {
  const [totalUsers, technical, aptitude, coding, mockInterview, practiceTest] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ 'assessmentAccess.technical': true }),
    User.countDocuments({ 'assessmentAccess.aptitude': true }),
    User.countDocuments({ 'assessmentAccess.coding': true }),
    User.countDocuments({ 'assessmentAccess.mockInterview': true }),
    User.countDocuments({ 'assessmentAccess.Practice Test': true }),
  ]);

  return {
    totalUsers,
    assessments: {
      technical: {
        usersWithAccess: technical,
        active: technical > 0,
      },
      aptitude: {
        usersWithAccess: aptitude,
        active: aptitude > 0,
      },
      coding: {
        usersWithAccess: coding,
        active: coding > 0,
      },
      mockInterview: {
        usersWithAccess: mockInterview,
        active: mockInterview > 0,
      },
      'Practice Test': {
        usersWithAccess: practiceTest,
        active: practiceTest > 0,
      },
    },
  };
}

async function runAdminQuery(label, task, fallback) {
  if (!isMongoReady()) {
    return fallback;
  }

  try {
    const result = await task();
    return result ?? fallback;
  } catch (error) {
    return fallback;
  }
}

exports.getSummary = asyncHandler(async (req, res) => {
  const settled = await Promise.allSettled([
    runAdminQuery('summary.userCount', () => User.countDocuments(), 0),
    runAdminQuery('summary.activeUserCount', () => User.countDocuments({ isActive: true }), 0),
    runAdminQuery('summary.adminCount', () => User.countDocuments({ role: 'admin' }), 0),
    runAdminQuery('summary.questionCount', () => Question.countDocuments(), 0),
    runAdminQuery('summary.aiQuestionCount', () => AIQuestion.countDocuments(), 0),
    runAdminQuery('summary.attemptCount', () => Attempt.countDocuments(), 0),
    runAdminQuery('summary.codingCount', () => CodingAttempt.countDocuments(), 0),
    runAdminQuery('summary.interviewCount', () => MockInterviewSession.countDocuments(), 0),
    runAdminQuery('summary.progressCount', () => UserProgress.countDocuments(), 0),
    runAdminQuery('summary.leaderboard', () => getLeaderboard(10), []),
    runAdminQuery(
      'summary.averageXp',
      async () => {
        const averageXpAggregate = await UserProgress.aggregate([{ $group: { _id: null, averageXp: { $avg: '$xp' } } }]);
        return Math.round(averageXpAggregate?.[0]?.averageXp || 0);
      },
      0
    ),
  ]);

  const [userCount, activeUserCount, adminCount, questionCount, aiQuestionCount, attemptCount, codingCount, interviewCount, progressCount, leaderboard, averageXp] = settled.map((item, index) => {
    if (item.status === 'fulfilled') {
      return item.value;
    }

    return index === 9 ? [] : 0;
  });

  const resolvedUserCount = toCount(userCount);
  const resolvedActiveUserCount = toCount(activeUserCount);
  const resolvedAdminCount = toCount(adminCount);
  const resolvedLeaderboard = leaderboard;
  const resolvedAverageXp = toCount(averageXp);

  return res.apiSuccess(
    {
      summary: {
        userCount: resolvedUserCount,
        activeUserCount: resolvedActiveUserCount,
        adminCount: resolvedAdminCount,
        questionCount,
        aiQuestionCount,
        attemptCount,
        codingCount,
        interviewCount,
        progressCount,
        averageXp: resolvedAverageXp,
      },
      leaderboard: resolvedLeaderboard,
    },
    'Admin summary loaded'
  );
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { search = '', role, isActive, limit = 25, page = 1 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  if (role) query.role = role;
  if (isActive === 'true') query.isActive = true;
  if (isActive === 'false') query.isActive = false;

  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);

  if (!isMongoReady()) {
    const normalizedSearch = String(search || '').trim().toLowerCase();
    const filteredUsers = LOCAL_USERS.filter((user) => {
      const matchesSearch = !normalizedSearch
        || user.name.toLowerCase().includes(normalizedSearch)
        || user.email.toLowerCase().includes(normalizedSearch);
      const matchesRole = !role || user.role === role;
      const matchesActive = isActive !== 'true' && isActive !== 'false'
        ? true
        : user.isActive === (isActive === 'true');

      return matchesSearch && matchesRole && matchesActive;
    });
    const pageStart = (safePage - 1) * safeLimit;
    const users = filteredUsers.slice(pageStart, pageStart + safeLimit).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      preferredLanguage: user.preferredLanguage,
      xp: 0,
      level: 1,
      streak: 0,
      badges: [],
      resumeUrl: null,
      resumeFileName: null,
      resumeUploadedAt: null,
      hasResume: false,
      assessmentAccess: normalizeAssessmentAccess(user.assessmentAccess),
    }));

    return res.apiSuccess(
      {
        users,
        total: filteredUsers.length,
        page: safePage,
        limit: safeLimit,
      },
      'Users loaded'
    );
  }

  const [usersResult, totalResult] = await Promise.allSettled([
    runAdminQuery(
      'users.list',
      () => User.find(query)
        .select('name email role isActive assessmentAccess preferredLanguage createdAt updatedAt resumeUrl resumeFileName resumeMimeType')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      []
    ),
    runAdminQuery('users.total', () => User.countDocuments(query), 0),
  ]);

  const users = usersResult.status === 'fulfilled' ? usersResult.value : [];
  const total = totalResult.status === 'fulfilled' ? totalResult.value : 0;

  const resolvedUsers = users;
  const resolvedTotal = total;

  const progressByUser = resolvedUsers.length
    ? await runAdminQuery('users.progress', () => UserProgress.find({ user: { $in: resolvedUsers.map((user) => user._id) } }).lean(), [])
    : [];
  const progressMap = new Map((progressByUser || []).map((item) => [String(item.user), item]));

  const data = resolvedUsers.map((user) => {
    const progress = progressMap.get(String(user._id));
    return {
      ...user,
      xp: progress?.xp || 0,
      level: progress?.level || 1,
      streak: progress?.streak || 0,
      badges: progress?.badges || [],
      resumeUrl: user.resumeUrl || null,
      resumeFileName: user.resumeFileName || null,
      resumeUploadedAt: user.resumeUrl ? user.updatedAt : null,
      hasResume: !!user.resumeUrl,
      assessmentAccess: normalizeAssessmentAccess(user.assessmentAccess),
    };
  });

  return res.apiSuccess({ users: data, total: resolvedTotal, page: safePage, limit: safeLimit }, 'Users loaded');
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, isActive, preferredLanguage, name } = req.body;

  const user = await User.findById(id);
  if (!user) return sendError(res, 'User not found', 404);

  if (typeof role === 'string') user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (typeof preferredLanguage === 'string') user.preferredLanguage = preferredLanguage;
  if (typeof name === 'string') user.name = name;

  user.refreshTokenVersion += 1;
  await user.save();

  return res.apiSuccess(
    {
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        preferredLanguage: user.preferredLanguage,
      },
    },
    'User updated'
  );
});

exports.listQuestions = asyncHandler(async (req, res) => {
  const { source = 'quiz', module, limit = 25 } = req.query;
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);

  const model = source === 'ai' ? AIQuestion : Question;
  const query = {};
  if (module) query.module = module;

  const questions = await runAdminQuery(
    `questions.list.${source}`,
    () => model.find(query).sort({ createdAt: -1 }).limit(safeLimit).lean(),
    []
  );
  return res.apiSuccess({ questions }, 'Questions loaded');
});

exports.listInterviews = asyncHandler(async (req, res) => {
  const sessions = await runAdminQuery(
    'interviews.list',
    () => MockInterviewSession.find({})
      .populate('user', 'name email role preferredLanguage')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    []
  );

  return res.apiSuccess({ sessions }, 'Interview sessions loaded');
});

exports.listAssessments = asyncHandler(async (req, res) => {
  const assessments = await runAdminQuery(
    'assessments.list',
    () => Assessment.find().sort({ order: 1, createdAt: -1 }).lean(),
    []
  );

  return res.apiSuccess({ assessments }, 'Assessments loaded');
});

exports.uploadAssessmentPdf = asyncHandler(async (req, res) => {
  // Expecting multer to populate req.file
  const file = req.file;
  if (!file) {
    return sendError(res, 'No file uploaded', 400);
  }

  const filename = String(file.originalname || '').toLowerCase();
  if (!filename.endsWith('.pdf') && file.mimetype !== 'application/pdf') {
    return sendError(res, 'Unsupported file format. Please upload a PDF.', 400);
  }

  try {
    const data = await pdfParse(file.buffer);
    const text = data && data.text ? String(data.text || '') : '';
    const questions = parseQuestionsFromText(text || '');

    if (!questions.length) {
      return res.apiSuccess({ questions: [] }, 'No questions parsed from PDF');
    }

    return res.apiSuccess({ questions }, 'PDF parsed successfully');
  } catch (err) {
    console.error('PDF parse error', err);
    return sendError(res, 'Unable to parse PDF file', 500);
  }
});

exports.createAssessment = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    accessKey,
    module,
    category,
    difficulty,
    count,
    duration,
    passingScore,
    topics,
    questions,
    active,
    order,
  } = req.body;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return sendError(res, 'At least one question is required to create an assessment', 400);
  }

  const assessment = await Assessment.create({
    title,
    description: description || '',
    accessKey,
    module: module || null,
    category: category || '',
    difficulty: difficulty || 'medium',
    count: typeof count === 'number' ? count : 10,
    duration: typeof duration === 'number' ? duration : 30,
    passingScore: typeof passingScore === 'number' ? passingScore : 60,
    topics: Array.isArray(topics)
      ? topics.filter((topic) => typeof topic === 'string' && topic.trim()).map((topic) => topic.trim())
      : [],
    questions: Array.isArray(questions)
      ? questions.map((question) => ({
          text: String(question.text || ''),
          options: Array.isArray(question.options)
            ? question.options.map((option) => String(option || ''))
            : [],
          correctAnswer: Number(question.correctAnswer) || 0,
          topic: String(question.topic || ''),
          category: String(question.category || ''),
          marks: Number(question.marks) || 1,
          explanation: String(question.explanation || ''),
        }))
      : [],
    active: typeof active === 'boolean' ? active : true,
    order: typeof order === 'number' ? order : 0,
    createdBy: req.user && req.user._id ? req.user._id : null,
  });

  return res.apiSuccess({ assessment }, 'Assessment created');
});

exports.updateAssessment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assessment = await Assessment.findById(id);
  if (!assessment) {
    return sendError(res, 'Assessment not found', 404);
  }

  if (req.body.questions !== undefined) {
    if (!Array.isArray(req.body.questions) || req.body.questions.length === 0) {
      return sendError(res, 'At least one question is required to update an assessment', 400);
    }
  }

  const updateFields = [
    'title',
    'description',
    'accessKey',
    'module',
    'category',
    'difficulty',
    'count',
    'duration',
    'passingScore',
    'topics',
    'questions',
    'active',
    'order',
  ];

  updateFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      assessment[field] = req.body[field];
    }
  });

  await assessment.save();

  return res.apiSuccess({ assessment }, 'Assessment updated');
});

exports.deleteAssessment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assessment = await Assessment.findById(id);
  if (!assessment) {
    return sendError(res, 'Assessment not found', 404);
  }

  await assessment.deleteOne();

  return res.apiSuccess({ id }, 'Assessment deleted');
});

exports.getReports = asyncHandler(async (req, res) => {
  const [leaderboard, topUsers] = await Promise.allSettled([
    runAdminQuery('reports.leaderboard', () => getLeaderboard(10), []),
    runAdminQuery(
      'reports.topUsers',
      () => UserProgress.find({}).sort({ xp: -1 }).limit(5).populate('user', 'name email preferredLanguage').lean(),
      []
    ),
  ]);

  return res.apiSuccess(
    {
      reports: {
        leaderboard: leaderboard.status === 'fulfilled' ? leaderboard.value : [],
        topUsers: topUsers.status === 'fulfilled' ? topUsers.value : [],
        generatedAt: new Date().toISOString(),
      },
    },
    'Platform reports loaded'
  );
});

exports.getUserResume = asyncHandler(async (req, res) => {
  const { id: targetUserId } = req.params;

  // Verify that the requesting user is an admin (middleware already checks this)
  if (!isMongoReady()) {
    return sendError(res, 'Database unavailable', 503);
  }

  // Fetch the target user's resume data
  const targetUser = await User.findById(targetUserId).select('name email resumeUrl resumeFileName resumeMimeType').lean();
  if (!targetUser) {
    return sendError(res, 'User not found', 404);
  }

  const resumeUrl = targetUser.resumeUrl || null;
  if (!resumeUrl) {
    return sendError(res, 'No resume available for this user', 404);
  }

  const forceDownload = isDownloadRequest(req);

  // Fetch the remote resource and stream it back with correct headers
  try {
    const remoteResp = await fetch(resumeUrl);

    if (!remoteResp.ok) {
      console.error('[ADMIN RESUME] Cloudinary fetch failed', {
        status: remoteResp.status,
        statusText: remoteResp.statusText,
      });
      return sendError(res, 'Failed to fetch resume file from storage', 502);
    }

    const contentType = resolveResumeContentType({
      remoteContentType: remoteResp.headers.get('content-type'),
      storedMimeType: targetUser.resumeMimeType,
      filename: targetUser.resumeFileName,
      resumeUrl,
    });
    const safeFilename = resolveResumeFilename(targetUser.resumeFileName, contentType);

    const disposition = forceDownload
      ? `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
      : 'inline';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

    // Stream the response body to the client
    const body = remoteResp.body;
    if (body && typeof body.pipe === 'function') {
      body.on('error', (err) => {
        console.error('[ADMIN RESUME] body stream error', err.stack || err.message || err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error while reading resume' });
        }
      });
      
      res.on('error', (err) => {
        console.error('[ADMIN RESUME] response stream error', err.stack || err.message || err);
      });
      
      body.pipe(res);
      return;
    }

    if (body && typeof body.getReader === 'function') {
      const { Readable } = require('stream');
      try {
        const nodeStream = Readable.fromWeb(body);
        nodeStream.on('error', (err) => {
          console.error('[ADMIN RESUME] converted stream error', err.stack || err.message || err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Stream error while reading resume' });
          }
        });
        res.on('error', (err) => {
          console.error('[ADMIN RESUME] response stream error', err.stack || err.message || err);
        });
        nodeStream.pipe(res);
        return;
      } catch (streamError) {
        console.error('[ADMIN RESUME] failed to convert Web ReadableStream', streamError.stack || streamError.message || streamError);
      }
    }

    const buffer = await remoteResp.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('[ADMIN RESUME] Error serving admin resume:', error.stack || error.message || error);
    return sendError(res, 'Failed to retrieve resume file', 500);
  }
});

exports.sendResumeReminder = asyncHandler(async (req, res) => {
  const { id: targetUserId } = req.params;

  console.log('[ADMIN REMINDER] Request received for user:', targetUserId);

  if (!isMongoReady()) {
    console.error('[ADMIN REMINDER] Database not ready');
    return sendError(res, 'Database unavailable', 503);
  }

  if (!isEmailConfigured()) {
    console.error('[ADMIN REMINDER] Email service not configured');
    return sendError(res, 'Email service is not configured', 500);
  }

  const targetUser = await User.findById(targetUserId).select('name email resumeUrl').lean();
  if (!targetUser) {
    console.error('[ADMIN REMINDER] User not found:', targetUserId);
    return sendError(res, 'User not found', 404);
  }

  if (targetUser.resumeUrl) {
    console.warn('[ADMIN REMINDER] User already has resume:', targetUserId);
    return sendError(res, 'Cannot send reminder to a user who already uploaded a resume', 400);
  }

  if (!targetUser.email) {
    console.error('[ADMIN REMINDER] User email missing:', targetUserId);
    return sendError(res, 'User email is missing', 400);
  }

  if (!canSendReminder(targetUserId)) {
    console.warn('[ADMIN REMINDER] Rate limited:', targetUserId);
    return sendError(res, 'Reminder already sent recently. Please wait a moment before sending again.', 429);
  }

  try {
    console.log('[ADMIN REMINDER] Calling sendResumeReminderEmail for:', targetUser.email);
    const emailResult = await sendResumeReminderEmail(targetUser);
    console.log('[ADMIN REMINDER] sendResumeReminderEmail returned:', emailResult);
    
    // ONLY record cooldown AFTER email actually sends successfully
    recordReminderSent(targetUserId);
    console.log('[ADMIN REMINDER] Email sent successfully, cooldown recorded');
    
    // ONLY return success AFTER all of the above completes
    return res.apiSuccess({ emailId: emailResult.id }, 'Reminder email sent successfully');
  } catch (error) {
    console.error('[ADMIN REMINDER] FINAL EMAIL ERROR:', error.message || error);
    console.error('[ADMIN REMINDER] Full error:', error);
    const message = error?.message || 'Failed to send resume reminder email';
    // Return REAL backend error to frontend
    return res.status(500).json({ success: false, message });
  }
});

exports.getAssessmentAccess = asyncHandler(async (req, res) => {
  if (!isMongoReady()) {
    const user = findLocalUserById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const assessmentAccess = normalizeAssessmentAccess(user.assessmentAccess);
    return res.apiSuccess(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        assessmentAccess,
        enabled: hasAnyAssessmentAccess(assessmentAccess),
      },
      'Assessment access loaded'
    );
  }

  const user = await User.findById(req.params.id)
    .select('name email assessmentAccess')
    .lean();

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const assessmentAccess = normalizeAssessmentAccess(user.assessmentAccess);

  return res.apiSuccess(
    {
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
      assessmentAccess,
      enabled: hasAnyAssessmentAccess(assessmentAccess),
    },
    'Assessment access loaded'
  );
});

exports.updateAssessmentAccess = asyncHandler(async (req, res) => {
  if (!isMongoReady()) {
    const currentUser = findLocalUserById(req.params.id);
    if (!currentUser) {
      return sendError(res, 'User not found', 404);
    }

    const assessmentAccess = mergeAssessmentAccess(
      currentUser.assessmentAccess,
      req.body.assessmentAccess
    );
    const user = updateLocalUser(req.params.id, { assessmentAccess });

    return res.apiSuccess(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        assessmentAccess,
        enabled: hasAnyAssessmentAccess(assessmentAccess),
      },
      'Assessment access updated'
    );
  }

  const assessmentAccessUpdate = Object.entries(req.body.assessmentAccess)
    .reduce((updates, [key, enabled]) => {
      updates[`assessmentAccess.${key}`] = enabled;
      return updates;
    }, {});

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: assessmentAccessUpdate },
    { new: true, runValidators: true }
  ).select('name email assessmentAccess');

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const assessmentAccess = normalizeAssessmentAccess(user.assessmentAccess);

  return res.apiSuccess(
    {
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
      assessmentAccess,
      enabled: hasAnyAssessmentAccess(assessmentAccess),
    },
    'Assessment access updated'
  );
});

exports.getAssessmentAccessSummary = asyncHandler(async (req, res) => {
  if (!isMongoReady()) {
    return res.apiSuccess(
      { summary: buildAssessmentAccessSummaryFromUsers(LOCAL_USERS) },
      'Assessment access summary loaded'
    );
  }

  const summary = await buildAssessmentAccessSummary();
  return res.apiSuccess({ summary }, 'Assessment access summary loaded');
});

exports.bulkUpdateAssessmentAccess = asyncHandler(async (req, res) => {
  const enabled = req.body.enabled === true;
  const nextAssessmentAccess = ASSESSMENT_ACCESS_KEYS.reduce((access, key) => {
    access[key] = enabled;
    return access;
  }, {});

  if (!isMongoReady()) {
    let modifiedUsers = 0;
    LOCAL_USERS.forEach((user) => {
      const previousAccess = normalizeAssessmentAccess(user.assessmentAccess);
      if (ASSESSMENT_ACCESS_KEYS.some((key) => previousAccess[key] !== enabled)) {
        modifiedUsers += 1;
      }
      updateLocalUser(user.id, {
        assessmentAccess: { ...nextAssessmentAccess },
      });
    });

    return res.apiSuccess(
      {
        enabled,
        matchedUsers: LOCAL_USERS.length,
        modifiedUsers,
        summary: buildAssessmentAccessSummaryFromUsers(LOCAL_USERS),
      },
      enabled
        ? 'Assessment access granted to all users'
        : 'Assessment access revoked for all users'
    );
  }

  const assessmentAccessUpdate = ASSESSMENT_ACCESS_KEYS.reduce((updates, key) => {
    updates[`assessmentAccess.${key}`] = enabled;
    return updates;
  }, {});

  const result = await User.updateMany({}, { $set: assessmentAccessUpdate });
  const summary = await buildAssessmentAccessSummary();

  return res.apiSuccess(
    {
      enabled,
      matchedUsers: result.matchedCount || 0,
      modifiedUsers: result.modifiedCount || 0,
      summary,
    },
    enabled
      ? 'Assessment access granted to all users'
      : 'Assessment access revoked for all users'
  );
});

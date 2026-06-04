const fs = require('fs');
const util = require('util');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { Configuration, OpenAIApi } = require('openai');

const readFile = util.promisify(fs.readFile);

async function extractTextFromFile(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const dataBuffer = await readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text || '';
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  // Fallback to reading as text
  const buf = await readFile(filePath, 'utf8').catch(() => null);
  return buf || '';
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
  const cfg = new Configuration({ apiKey });
  return new OpenAIApi(cfg);
}

async function callLLMForAnalysis(text) {
  const client = getOpenAIClient();
  const prompt = [
    'You are an AI resume analyzer. Given the resume text delimited by triple backticks, extract the following as JSON: skills (array), education (array of objects with degree, institution, dates), experience (array of objects with title, company, dates, bullets), projects (array), certifications (array), keywords (array). Also score ATS (0-100), resume_quality (0-100), interview_readiness (0-100), and provide improvement_suggestions (array), missing_keywords (array), grammar_suggestions (array), formatting_suggestions (array), role_matches (array of objects with role and fit_score). Return ONLY valid JSON.',
    'Resume text:',
    '```',
    text,
    '```',
    ''
  ].join('\n');

  const response = await client.createChatCompletion({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You are a helpful resume analyzer.' }, { role: 'user', content: prompt }],
    max_tokens: 1200,
    temperature: 0.2,
  });

  const content = response?.data?.choices?.[0]?.message?.content || response?.data?.choices?.[0]?.text || '';
  try {
    const jsonStart = content.indexOf('{');
    const json = content.slice(jsonStart);
    return JSON.parse(json);
  } catch (e) {
    // fallback: return raw content
    return { raw: content }; 
  }
}

async function analyzeResume(filePath, originalFileUrl, userId) {
  const text = await extractTextFromFile(filePath);
  const analysis = await callLLMForAnalysis(text);

  const doc = new ResumeAnalysis({
    userId: userId || null,
    originalFile: originalFileUrl || filePath,
    parsedText: text,
    analysis,
  });

  await doc.save();
  return doc;
}

module.exports = { analyzeResume };

const LANGUAGE_MAP = {
  javascript: { id: 63, label: 'JavaScript (Node.js)' },
  python: { id: 71, label: 'Python (3.8.1)' },
  java: { id: 62, label: 'Java (OpenJDK 13.0.1)' },
  c: { id: 50, label: 'C (GCC 9.2.0)' },
  cpp: { id: 54, label: 'C++ (GCC 9.2.0)' },
};

function getLanguageConfig(language) {
  return LANGUAGE_MAP[language] || null;
}

async function submitToJudge0({ language, sourceCode, stdin, expectedOutput, apiUrl, apiKey }) {
  const config = getLanguageConfig(language);
  if (!config || !apiUrl) {
    return {
      status: 'failed',
      stdout: '',
      stderr: 'Judge0 is not configured for this language.',
      compileOutput: '',
      time: 0,
      memory: 0,
      token: null,
      url: null,
    };
  }

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['X-Auth-Token'] = apiKey;
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const createResponse = await fetch(`${apiUrl.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      language_id: config.id,
      source_code: sourceCode,
      stdin: stdin || '',
      expected_output: expectedOutput || '',
    }),
  });

  if (!createResponse.ok) {
    const text = await createResponse.text();
    return {
      status: 'failed',
      stdout: '',
      stderr: text,
      compileOutput: '',
      time: 0,
      memory: 0,
      token: null,
      url: null,
    };
  }

  const submission = await createResponse.json();
  const result = submission?.status?.description || 'Unknown';

  return {
    status: result.toLowerCase().includes('accepted') ? 'accepted' : result.toLowerCase().includes('wrong') ? 'wrong-answer' : result.toLowerCase().includes('time') ? 'time-limit' : result.toLowerCase().includes('compile') ? 'compile-error' : result.toLowerCase().includes('runtime') ? 'runtime-error' : 'failed',
    stdout: submission.stdout || '',
    stderr: submission.stderr || '',
    compileOutput: submission.compile_output || '',
    time: Math.round((submission.time || 0) * 1000),
    memory: submission.memory || 0,
    token: submission.token || null,
    url: `${apiUrl.replace(/\/$/, '')}/submissions/${submission.token}`,
  };
}

module.exports = {
  getLanguageConfig,
  submitToJudge0,
};

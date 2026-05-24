function buildChallenge(index, language, difficulty, title, prompt, starterCode, testCases, tags, expectedComplexity, timeLimitMinutes = 30) {
  return {
    title,
    prompt,
    starterCode,
    language,
    difficulty,
    tags,
    timeLimitMinutes,
    sampleInput: testCases[0]?.input || '',
    sampleOutput: testCases[0]?.expectedOutput || '',
    constraints: [
      'Write a correct and efficient solution.',
      'Handle edge cases and large inputs.',
    ],
    testCases,
    expectedComplexity,
    isActive: true,
    createdBy: null,
    metadata: { seedIndex: index },
  };
}

function generateCodingChallenges() {
  return [
    buildChallenge(
      1,
      'javascript',
      'easy',
      'Reverse a String',
      'Read a string from stdin and print the reversed string.',
      `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\nconsole.log(input.split('').reverse().join(''));\n`,
      [
        { input: 'hello', expectedOutput: 'olleh' },
        { input: 'interview', expectedOutput: 'weivretni' },
      ],
      ['strings', 'basics'],
      'O(n)',
      15
    ),
    buildChallenge(
      2,
      'python',
      'easy',
      'Sum of Integers',
      'Read two integers from stdin and print their sum.',
      `import sys\nnums = list(map(int, sys.stdin.read().split()))\nprint(sum(nums))\n`,
      [
        { input: '2 3', expectedOutput: '5' },
        { input: '10 20', expectedOutput: '30' },
      ],
      ['math', 'basics'],
      'O(1)',
      15
    ),
    buildChallenge(
      3,
      'javascript',
      'medium',
      'Fibonacci Sequence',
      'Print the first n Fibonacci numbers separated by spaces.',
      `const fs = require('fs');\nconst n = Number(fs.readFileSync(0, 'utf8').trim());\nlet a = 0, b = 1, result = [];\nfor (let i = 0; i < n; i++) { result.push(a); [a, b] = [b, a + b]; }\nconsole.log(result.join(' '));\n`,
      [
        { input: '5', expectedOutput: '0 1 1 2 3' },
        { input: '7', expectedOutput: '0 1 1 2 3 5 8' },
      ],
      ['arrays', 'recursion'],
      'O(n)',
      20
    ),
    buildChallenge(
      4,
      'python',
      'medium',
      'Count Vowels',
      'Count the number of vowels in the given string.',
      `import sys\ns = sys.stdin.read().strip().lower()\nprint(sum(1 for ch in s if ch in 'aeiou'))\n`,
      [
        { input: 'interview', expectedOutput: '4' },
        { input: 'algorithm', expectedOutput: '3' },
      ],
      ['strings', 'counting'],
      'O(n)',
      20
    ),
    buildChallenge(
      5,
      'javascript',
      'hard',
      'Balanced Parentheses',
      'Given a string containing brackets, print YES if it is balanced otherwise NO.',
      `const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\nconst stack = [];\nconst pairs = {')':'(',']':'[','}':'{'};\nlet ok = true;\nfor (const ch of s) {\n  if ('([{'.includes(ch)) stack.push(ch);\n  else if (')]}'.includes(ch)) {\n    if (stack.pop() !== pairs[ch]) { ok = false; break; }\n  }\n}\nconsole.log(ok && stack.length === 0 ? 'YES' : 'NO');\n`,
      [
        { input: '([]){}', expectedOutput: 'YES' },
        { input: '([)]', expectedOutput: 'NO' },
      ],
      ['stacks', 'parsing'],
      'O(n)',
      30
    ),
    buildChallenge(
      6,
      'python',
      'hard',
      'Two Sum',
      'Given a target and a list of numbers, print the 1-based indices of two numbers that add up to the target.',
      `import sys\nitems = list(map(int, sys.stdin.read().split()))\ntarget, nums = items[0], items[1:]\nseen = {}\nfor i, n in enumerate(nums, 1):\n    need = target - n\n    if need in seen:\n        print(seen[need], i)\n        break\n    seen[n] = i\n`,
      [
        { input: '9 2 7 11 15', expectedOutput: '1 2' },
        { input: '6 3 2 4', expectedOutput: '2 3' },
      ],
      ['hashmap', 'arrays'],
      'O(n)',
      30
    ),
  ];
}

module.exports = { generateCodingChallenges };

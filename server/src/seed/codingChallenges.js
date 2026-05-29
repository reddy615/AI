function validateTestCases(title, testCases) {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new Error(`Coding challenge "${title}" must include at least one test case.`)
  }

  testCases.forEach((testCase, index) => {
    if (!testCase || typeof testCase !== 'object') {
      throw new Error(`Coding challenge "${title}" test case ${index + 1} must be an object.`)
    }

    if (!Object.prototype.hasOwnProperty.call(testCase, 'input')) {
      throw new Error(`Coding challenge "${title}" test case ${index + 1} is missing input.`)
    }

    if (!Object.prototype.hasOwnProperty.call(testCase, 'expectedOutput')) {
      throw new Error(`Coding challenge "${title}" test case ${index + 1} is missing expectedOutput.`)
    }
  })
}

function buildChallenge({
  title,
  language,
  difficulty,
  description,
  starterCode,
  testCases,
  tags,
  expectedComplexity,
  timeLimitMinutes = 30,
  constraints = [],
}) {
  validateTestCases(title, testCases)

  const publicSample = testCases[0] || { input: '', expectedOutput: '' }

  return {
    title,
    prompt: [
      `Description: ${description}`,
      '',
      'Examples:',
      `Input: ${publicSample.input}`,
      `Output: ${publicSample.expectedOutput}`,
      '',
      'Constraints:',
      ...constraints.map((constraint) => `- ${constraint}`),
    ].join('\n'),
    starterCode,
    language,
    difficulty,
    tags,
    timeLimitMinutes,
    sampleInput: publicSample.input,
    sampleOutput: publicSample.expectedOutput,
    constraints,
    testCases,
    expectedComplexity,
    isActive: true,
    createdBy: null,
  }
}

function generateCodingChallenges() {
  return [
    buildChallenge({
      title: 'Two Sum',
      language: 'javascript',
      difficulty: 'easy',
      description: 'Return the indices of the two numbers that add up to the target.',
      starterCode: `const fs = require('fs')\nconst input = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number)\nconst target = input[0]\nconst nums = input.slice(1)\n\nfunction twoSum(nums, target) {\n  const seen = new Map()\n  for (let i = 0; i < nums.length; i += 1) {\n    const need = target - nums[i]\n    if (seen.has(need)) return [seen.get(need), i]\n    seen.set(nums[i], i)\n  }\n  return []\n}\n\nconst result = twoSum(nums, target)\nconsole.log(result.join(' '))\n`,
      testCases: [
        { input: '9 2 7 11 15', expectedOutput: '0 1' },
        { input: '6 3 2 4', expectedOutput: '1 2' },
        { input: '7 2 3 4 5', expectedOutput: '1 2' },
      ],
      tags: ['arrays', 'hash-map'],
      expectedComplexity: 'O(n)',
      constraints: [
        'Exactly one valid answer exists for each test case.',
        'Return zero-based indices in ascending order.',
      ],
    }),
    buildChallenge({
      title: 'Reverse String',
      language: 'python',
      difficulty: 'easy',
      description: 'Reverse the given string and print it.',
      starterCode: `import sys\n\ntext = sys.stdin.read().rstrip('\\n')\nprint(text[::-1])\n`,
      testCases: [
        { input: 'hello', expectedOutput: 'olleh' },
        { input: 'Interview Prep', expectedOutput: 'perP weivretnI' },
        { input: 'abc123', expectedOutput: '321cba' },
      ],
      tags: ['strings'],
      expectedComplexity: 'O(n)',
      constraints: [
        'Preserve all characters exactly as given.',
        'Input may contain spaces.',
      ],
    }),
    buildChallenge({
      title: 'Palindrome Number',
      language: 'javascript',
      difficulty: 'easy',
      description: 'Determine whether a number reads the same forwards and backwards.',
      starterCode: `const fs = require('fs')\nconst value = fs.readFileSync(0, 'utf8').trim()\n\nfunction isPalindromeNumber(text) {\n  return text === text.split('').reverse().join('')\n}\n\nconsole.log(isPalindromeNumber(value) ? 'true' : 'false')\n`,
      testCases: [
        { input: '121', expectedOutput: 'true' },
        { input: '10', expectedOutput: 'false' },
        { input: '1331', expectedOutput: 'true' },
      ],
      tags: ['math', 'strings'],
      expectedComplexity: 'O(log n)',
      constraints: [
        'Treat the input as a non-negative integer.',
        'Do not use extra conversion that changes the numeric value.',
      ],
    }),
    buildChallenge({
      title: 'Valid Parentheses',
      language: 'javascript',
      difficulty: 'easy',
      description: 'Check whether a string of brackets is balanced.',
      starterCode: `const fs = require('fs')\nconst s = fs.readFileSync(0, 'utf8').trim()\nconst stack = []\nconst pairs = { ')': '(', ']': '[', '}': '{' }\nlet valid = true\n\nfor (const ch of s) {\n  if ('([{'.includes(ch)) stack.push(ch)\n  else if (')]}'.includes(ch) && stack.pop() !== pairs[ch]) {\n    valid = false\n    break\n  }\n}\n\nconsole.log(valid && stack.length === 0 ? 'true' : 'false')\n`,
      testCases: [
        { input: '()[]{}', expectedOutput: 'true' },
        { input: '(]', expectedOutput: 'false' },
        { input: '([{}])', expectedOutput: 'true' },
      ],
      tags: ['stacks', 'parsing'],
      expectedComplexity: 'O(n)',
      constraints: [
        'Only parentheses characters are included in the input.',
        'Return true only if every opener has the correct closer.',
      ],
    }),
    buildChallenge({
      title: 'Merge Sorted Arrays',
      language: 'python',
      difficulty: 'medium',
      description: 'Merge two sorted arrays into a single sorted array.',
      starterCode: `import sys\n\nvalues = list(map(int, sys.stdin.read().split()))\nm = values[0]\nn = values[1]\nnums1 = values[2:2 + m]\nnums2 = values[2 + m:2 + m + n]\n\nmerged = []\ni = j = 0\nwhile i < len(nums1) and j < len(nums2):\n    if nums1[i] <= nums2[j]:\n        merged.append(nums1[i])\n        i += 1\n    else:\n        merged.append(nums2[j])\n        j += 1\n\nmerged.extend(nums1[i:])\nmerged.extend(nums2[j:])\nprint(' '.join(map(str, merged)))\n`,
      testCases: [
        { input: '3 3 1 2 4 1 3 5', expectedOutput: '1 1 2 3 4 5' },
        { input: '2 4 1 3 2 4 6 8', expectedOutput: '1 2 3 4 6 8' },
      ],
      tags: ['arrays', 'two-pointers'],
      expectedComplexity: 'O(m + n)',
      constraints: [
        'Both input arrays are already sorted.',
        'Preserve duplicates in the final output.',
      ],
    }),
    buildChallenge({
      title: 'Binary Search',
      language: 'c',
      difficulty: 'medium',
      description: 'Find the index of a target value in a sorted array.',
      starterCode: `#include <stdio.h>\n\nint main(void) {\n  int n, target;\n  if (scanf("%d", &n) != 1) return 0;\n  int nums[1000];\n  for (int i = 0; i < n; i++) scanf("%d", &nums[i]);\n  scanf("%d", &target);\n\n  int left = 0, right = n - 1, answer = -1;\n  while (left <= right) {\n    int mid = left + (right - left) / 2;\n    if (nums[mid] == target) {\n      answer = mid;\n      break;\n    }\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n\n  printf("%d\n", answer);\n  return 0;\n}\n`,
      testCases: [
        { input: '5 1 3 5 7 9 7', expectedOutput: '3' },
        { input: '4 2 4 6 8 2', expectedOutput: '0' },
        { input: '6 1 2 3 4 5 6 10', expectedOutput: '-1' },
      ],
      tags: ['searching', 'divide-and-conquer'],
      expectedComplexity: 'O(log n)',
      constraints: [
        'The input array is sorted in non-decreasing order.',
        'Print -1 when the target does not exist.',
      ],
    }),
    buildChallenge({
      title: 'Fibonacci',
      language: 'javascript',
      difficulty: 'easy',
      description: 'Print the nth Fibonacci number using an iterative approach.',
      starterCode: `const fs = require('fs')\nconst n = Number(fs.readFileSync(0, 'utf8').trim())\n\nfunction fibonacci(count) {\n  if (count <= 1) return count\n  let prev = 0\n  let current = 1\n  for (let i = 2; i <= count; i += 1) {\n    const next = prev + current\n    prev = current\n    current = next\n  }\n  return current\n}\n\nconsole.log(fibonacci(n))\n`,
      testCases: [
        { input: '0', expectedOutput: '0' },
        { input: '1', expectedOutput: '1' },
        { input: '7', expectedOutput: '13' },
      ],
      tags: ['recursion', 'dynamic-programming'],
      expectedComplexity: 'O(n)',
      constraints: [
        'Use an iterative or memoized solution.',
        'Assume 0-indexed Fibonacci where F(0) = 0 and F(1) = 1.',
      ],
    }),
    buildChallenge({
      title: 'Linked List Cycle',
      language: 'python',
      difficulty: 'medium',
      description: 'Detect whether a linked list contains a cycle.',
      starterCode: `import sys\n\nvalues = list(map(int, sys.stdin.read().split()))\n# Input format: n, next pointers for each node, start index for the head\nn = values[0]\nnext_nodes = values[1:1 + n]\nhead = values[1 + n]\n\ndef has_cycle(next_nodes, head):\n    slow = head\n    fast = head\n    while fast != -1 and next_nodes[fast] != -1:\n        slow = next_nodes[slow]\n        fast = next_nodes[next_nodes[fast]]\n        if slow == fast:\n            return True\n    return False\n\nprint('true' if has_cycle(next_nodes, head) else 'false')\n`,
      testCases: [
        { input: '4 1 2 3 -1 0', expectedOutput: 'false' },
        { input: '4 1 2 0 -1 0', expectedOutput: 'true' },
      ],
      tags: ['linked-list', 'fast-slow-pointers'],
      expectedComplexity: 'O(n)',
      constraints: [
        'Use O(1) extra space if possible.',
        'Return true only if a cycle is reachable from the head node.',
      ],
    }),
    buildChallenge({
      title: 'Maximum Subarray',
      language: 'javascript',
      difficulty: 'medium',
      description: 'Find the contiguous subarray with the largest sum.',
      starterCode: `const fs = require('fs')\nconst nums = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number)\n\nfunction maxSubArray(values) {\n  let best = values[0]\n  let current = values[0]\n  for (let i = 1; i < values.length; i += 1) {\n    current = Math.max(values[i], current + values[i])\n    best = Math.max(best, current)\n  }\n  return best\n}\n\nconsole.log(maxSubArray(nums))\n`,
      testCases: [
        { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6' },
        { input: '1', expectedOutput: '1' },
        { input: '-1 -2 -3', expectedOutput: '-1' },
      ],
      tags: ['arrays', 'dynamic-programming'],
      expectedComplexity: 'O(n)',
      constraints: [
        'The subarray must contain at least one number.',
        'Return the maximum possible sum over all contiguous subarrays.',
      ],
    }),
    buildChallenge({
      title: 'Longest Common Prefix',
      language: 'python',
      difficulty: 'easy',
      description: 'Find the longest common prefix among an array of strings.',
      starterCode: `import sys\n\nwords = sys.stdin.read().split()\n\ndef longest_common_prefix(items):\n    if not items:\n        return ''\n    prefix = items[0]\n    for word in items[1:]:\n        while not word.startswith(prefix):\n            prefix = prefix[:-1]\n            if not prefix:\n                return ''\n    return prefix\n\nprint(longest_common_prefix(words))\n`,
      testCases: [
        { input: 'flower flow flight', expectedOutput: 'fl' },
        { input: 'dog racecar car', expectedOutput: '' },
        { input: 'interview internet internal', expectedOutput: 'inte' },
      ],
      tags: ['strings', 'prefix'],
      expectedComplexity: 'O(n * m)',
      constraints: [
        'Return an empty string when no common prefix exists.',
        'Input contains at least one string in each test case.',
      ],
    }),
  ]
}

module.exports = { generateCodingChallenges }

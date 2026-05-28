// Generator for sample quiz questions. Produces an array of question objects.
const aptitudeTopics = [
  { category: 'Arithmetic', topic: 'Percentages' },
  { category: 'Arithmetic', topic: 'Ratios and Proportions' },
  { category: 'Arithmetic', topic: 'Averages' },
  { category: 'Arithmetic', topic: 'Profit and Loss' },
  { category: 'Arithmetic', topic: 'Simple Interest' },
  { category: 'Arithmetic', topic: 'Compound Interest' },
  { category: 'Arithmetic', topic: 'Time, Speed and Distance' },
  { category: 'Arithmetic', topic: 'Time and Work' },
  { category: 'Arithmetic', topic: 'Pipes and Cisterns' },
  { category: 'Arithmetic', topic: 'Mixtures and Allegations' },
  { category: 'Arithmetic', topic: 'Sequences and Series' },
  { category: 'Arithmetic', topic: 'Permutations and Combinations' },
  { category: 'Arithmetic', topic: 'Probability' },
  { category: 'Arithmetic', topic: 'Geometry' },
  { category: 'Arithmetic', topic: 'Mensuration' },
  { category: 'Arithmetic', topic: 'Data Interpretation' },
  { category: 'Arithmetic', topic: 'Number System' },
  { category: 'Arithmetic', topic: 'Algebra' },
]

const topics = {
  aptitude: aptitudeTopics,
  reasoning: [
    { category: 'Logical', topic: 'Syllogism' },
    { category: 'Logical', topic: 'Series' },
    { category: 'Pattern', topic: 'Matrix' },
    { category: 'Puzzles', topic: 'Arrangement' },
  ],
  verbal: [
    { category: 'Vocabulary', topic: 'Synonyms' },
    { category: 'Grammar', topic: 'Error Spotting' },
    { category: 'Reading', topic: 'Comprehension' },
    { category: 'Vocabulary', topic: 'Antonyms' },
  ],
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildOptions(correctValue) {
  const numericCorrect = Number(correctValue)
  if (!Number.isNaN(numericCorrect)) {
    return [numericCorrect, numericCorrect + 1, numericCorrect - 1, numericCorrect + 2].map((value) => String(value))
  }

  return [String(correctValue), `${correctValue}x`, `not ${correctValue}`, `${correctValue}++`]
}

function buildAptitudeQuestion(topicIndex, questionIndex) {
  const topic = topics.aptitude[topicIndex % topics.aptitude.length]
  const difficulty = questionIndex % 3 === 0 ? 'easy' : (questionIndex % 3 === 1 ? 'medium' : 'hard')
  const base = (topicIndex + 1) * 7 + questionIndex + 5
  const variant = questionIndex % 4
  let text
  let correct

  if (variant === 0) {
    const percent = (topicIndex % 25) + 5
    const total = (base + 10) * 4
    text = `What is ${percent}% of ${total}?`
    correct = ((percent / 100) * total).toFixed(0)
  } else if (variant === 1) {
    const ratioRight = (topicIndex % 6) + 2
    const left = base + 3
    text = `Find the ratio of ${left} to ${left * ratioRight}.`
    correct = `1:${ratioRight}`
  } else if (variant === 2) {
    const first = base
    const second = base + 6
    const third = base + 12
    text = `Find the average of ${first}, ${second}, and ${third}.`
    correct = Math.round((first + second + third) / 3)
  } else {
    const principal = base * 10
    const rate = (topicIndex % 8) + 3
    text = `Find the simple interest on ${principal} at ${rate}% for 2 years.`
    correct = (principal * rate * 2) / 100
  }

  const options = buildOptions(correct)

  return {
    module: 'aptitude',
    category: topic.category,
    topic: topic.topic,
    difficulty,
    text,
    options: options.map((option) => ({ text: option })),
    correctIndex: 0,
    explanation: `Solve the ${topic.topic} question using the given values.`,
    marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
    negativeMarks: 0.25,
  }
}

function generateAptitude(i) {
  return buildAptitudeQuestion(i % topics.aptitude.length, i)
}

function generateAptitudeQuestionsForTopic(topicIndex, count = 80) {
  return Array.from({ length: count }, (_, questionIndex) => buildAptitudeQuestion(topicIndex, questionIndex))
}

function generateAptitudeTopicBank(perTopicCount = 80) {
  return topics.aptitude.flatMap((_, topicIndex) => generateAptitudeQuestionsForTopic(topicIndex, perTopicCount))
}

function generateReasoning(i) {
  const topic = topics.reasoning[i % topics.reasoning.length]
  const difficulty = i % 3 === 0 ? 'easy' : (i % 3 === 1 ? 'medium' : 'hard')
  const start = Math.floor(Math.random() * 10) + 1
  const step = (i % 5) + 1
  const sequence = [start, start + step, start + 2 * step, start + 3 * step]
  const missingIndex = Math.floor(Math.random() * 4)
  const correct = sequence[missingIndex]
  const text = `Find the missing number in the series: ${sequence.map((value, index) => (index === missingIndex ? '___' : value)).join(', ')}`
  const options = [correct, correct + step, correct - step, correct + 2 * step].map((value) => String(value))

  return {
    module: 'reasoning',
    category: topic.category,
    topic: topic.topic,
    difficulty,
    text,
    options: options.map((option) => ({ text: option })),
    correctIndex: 0,
    explanation: `Sequence increases by ${step}.`,
    marks: difficulty === 'easy' ? 1 : (difficulty === 'medium' ? 2 : 3),
    negativeMarks: 0.25,
  }
}

const vocab = ['happy', 'quick', 'bright', 'calm', 'ancient', 'brave', 'eager', 'fierce']
const synonyms = { happy: 'joyful', quick: 'fast', bright: 'smart', calm: 'serene', ancient: 'old', brave: 'courageous', eager: 'enthusiastic', fierce: 'ferocious' }

function generateVerbal(i) {
  const topic = topics.verbal[i % topics.verbal.length]
  const difficulty = i % 3 === 0 ? 'easy' : (i % 3 === 1 ? 'medium' : 'hard')
  const word = vocab[i % vocab.length]
  const correct = synonyms[word]
  const options = [correct, 'sad', 'slow', 'bright']

  return {
    module: 'verbal',
    category: topic.category,
    topic: topic.topic,
    difficulty,
    text: `Choose the synonym of '${word}'.`,
    options: options.map((option) => ({ text: option })),
    correctIndex: 0,
    explanation: `The synonym of ${word} is ${correct}.`,
    marks: difficulty === 'easy' ? 1 : (difficulty === 'medium' ? 2 : 3),
    negativeMarks: 0,
  }
}

function generateAll(countPerModule = 40) {
  const out = []
  for (let index = 0; index < countPerModule; index += 1) out.push(generateAptitude(index))
  for (let index = 0; index < countPerModule; index += 1) out.push(generateReasoning(index))
  for (let index = 0; index < countPerModule; index += 1) out.push(generateVerbal(index))
  return out
}

function generateModuleQuestions(module, countPerModule = 40) {
  if (module === 'reasoning') {
    return Array.from({ length: countPerModule }, (_, index) => generateReasoning(index))
  }

  if (module === 'verbal') {
    return Array.from({ length: countPerModule }, (_, index) => generateVerbal(index))
  }

  return Array.from({ length: countPerModule }, (_, index) => generateAptitude(index))
}

function getAptitudeTopics() {
  return aptitudeTopics.map((entry) => ({ ...entry }))
}

module.exports = {
  generateAll,
  generateModuleQuestions,
  generateAptitudeQuestionsForTopic,
  generateAptitudeTopicBank,
  getAptitudeTopics,
}

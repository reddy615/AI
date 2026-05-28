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

function buildAptitudeTopicQuestion(topic, topicIndex, questionIndex) {
  const difficulty = questionIndex % 3 === 0 ? 'easy' : (questionIndex % 3 === 1 ? 'medium' : 'hard')
  const seed = (topicIndex + 1) * 11 + questionIndex + 7

  switch (topic.topic) {
    case 'Percentages': {
      const value = (seed % 40) + 10
      const total = (seed + 30) * 2
      const correct = Math.round((value / 100) * total)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `What is ${value}% of ${total}?`,
        options: buildOptions(correct).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Use percentage = value / 100 x total.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Ratios and Proportions': {
      const left = seed + 5
      const rightMultiplier = (topicIndex % 5) + 2
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `If ${left} is to ${left * rightMultiplier}, what is the ratio in simplest form?`,
        options: [{ text: `1:${rightMultiplier}` }, { text: `${rightMultiplier}:1` }, { text: `2:${rightMultiplier}` }, { text: `1:${rightMultiplier + 1}` }],
        correctIndex: 0,
        explanation: 'Divide both terms by the same factor.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Averages': {
      const numbers = [seed, seed + 4, seed + 8]
      const correct = Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Find the average of ${numbers.join(', ')}.`,
        options: buildOptions(correct).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Add all values and divide by count.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Profit and Loss': {
      const cost = seed * 5
      const profitPercent = (topicIndex % 15) + 5
      const sell = Math.round(cost + (cost * profitPercent) / 100)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `An item costs ${cost}. If profit is ${profitPercent}%, what is the selling price?`,
        options: buildOptions(sell).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Selling price = cost price + profit.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Simple Interest': {
      const principal = seed * 10
      const rate = (topicIndex % 9) + 3
      const time = 2
      const correct = (principal * rate * time) / 100
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Find the simple interest on ${principal} at ${rate}% for ${time} years.`,
        options: buildOptions(correct).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'SI = (P x R x T) / 100.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Compound Interest': {
      const principal = seed * 8
      const rate = (topicIndex % 7) + 4
      const amount = Math.round(principal * Math.pow(1 + rate / 100, 2))
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `What is the amount after 2 years on ${principal} at ${rate}% compound interest?`,
        options: buildOptions(amount).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Use A = P(1 + R/100)^2.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Time, Speed and Distance': {
      const speed = (topicIndex % 8) + 4
      const time = (questionIndex % 5) + 2
      const distance = speed * time
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `A vehicle travels at ${speed} km/h for ${time} hours. What distance does it cover?`,
        options: buildOptions(distance).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Distance = speed x time.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Time and Work': {
      const days = (topicIndex % 8) + 2
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `If A can complete a job in ${days} days, what fraction of the work is done in 1 day?`,
        options: [{ text: `1/${days}` }, { text: `${days}/1` }, { text: `1/${days + 1}` }, { text: `2/${days}` }],
        correctIndex: 0,
        explanation: 'One day work is the reciprocal of total days.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Pipes and Cisterns': {
      const fill = (topicIndex % 8) + 3
      const drain = (topicIndex % 5) + 1
      const net = fill - drain
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `A pipe fills a tank in ${fill} hours and a leak empties it in ${drain} hours. What is the net hourly work rate?`,
        options: buildOptions(net).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Fill rate minus drain rate.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Mixtures and Allegations': {
      const a = (topicIndex % 9) + 1
      const b = a + 3
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `What is the ratio of cheaper ingredient to costlier ingredient when mixing values ${a} and ${b}?`,
        options: [{ text: `${b - a}:${a}` }, { text: `${a}:${b - a}` }, { text: `${a + b}:${b}` }, { text: `${b}:${a}` }],
        correctIndex: 0,
        explanation: 'Use allegation difference rule.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Sequences and Series': {
      const start = (topicIndex % 10) + 2
      const step = (questionIndex % 4) + 2
      const next = start + 3 * step
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Find the next term in the series: ${start}, ${start + step}, ${start + 2 * step}, ___.`,
        options: buildOptions(next).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'The series increases by a constant difference.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Permutations and Combinations': {
      const total = (topicIndex % 7) + 4
      const choose = 2
      const correct = (total * (total - 1)) / 2
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `How many ways can you choose ${choose} items from ${total} items?`,
        options: buildOptions(correct).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Use nC2 = n(n-1)/2.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Probability': {
      const favorable = (topicIndex % 4) + 1
      const total = favorable * 4
      const correct = `${favorable}/${total}`
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `What is the probability of an event with ${favorable} favorable outcomes out of ${total} total outcomes?`,
        options: [{ text: correct }, { text: `${total}/${favorable}` }, { text: `${favorable + 1}/${total}` }, { text: `1/${favorable}` }],
        correctIndex: 0,
        explanation: 'Probability = favorable outcomes / total outcomes.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Geometry': {
      const side = (topicIndex % 9) + 3
      const area = side * side
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Find the area of a square with side ${side} units.`,
        options: buildOptions(area).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Area of square = side x side.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Mensuration': {
      const radius = (topicIndex % 6) + 2
      const circumference = Math.round(2 * 3.14 * radius)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Find the circumference of a circle with radius ${radius} units.`,
        options: buildOptions(circumference).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Circumference = 2πr.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Data Interpretation': {
      const sales = [seed, seed + 5, seed + 10]
      const total = sales.reduce((sum, value) => sum + value, 0)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `A chart shows values ${sales.join(', ')}. What is the total?`,
        options: buildOptions(total).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Add all chart values.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Number System': {
      const divisor = (topicIndex % 7) + 2
      const number = divisor * ((questionIndex % 4) + 5)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Is ${number} divisible by ${divisor}?`,
        options: [{ text: 'Yes' }, { text: 'No' }, { text: 'Only sometimes' }, { text: 'Cannot be determined' }],
        correctIndex: 0,
        explanation: 'The number is constructed to be divisible.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Algebra': {
      const x = (topicIndex % 8) + 2
      const constant = x + 5
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `If x + 5 = ${constant}, what is the value of x?`,
        options: buildOptions(x).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Subtract 5 from both sides.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    default:
      return buildAptitudeQuestion(topicIndex, questionIndex)
  }
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
  const topicIndex = i % topics.aptitude.length
  return buildAptitudeTopicQuestion(topics.aptitude[topicIndex], topicIndex, i)
}

function generateAptitudeQuestionsForTopic(topicIndex, count = 80) {
  return Array.from({ length: count }, (_, questionIndex) => buildAptitudeTopicQuestion(topics.aptitude[topicIndex % topics.aptitude.length], topicIndex, questionIndex))
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

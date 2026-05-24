// Generator for sample quiz questions. Produces an array of question objects.
const topics = {
  aptitude: [
    { category: 'Quantitative', topic: 'Arithmetic' },
    { category: 'Quantitative', topic: 'Algebra' },
    { category: 'Quantitative', topic: 'Number Theory' },
    { category: 'Data Interpretation', topic: 'Charts' }
  ],
  reasoning: [
    { category: 'Logical', topic: 'Syllogism' },
    { category: 'Logical', topic: 'Series' },
    { category: 'Pattern', topic: 'Matrix' },
    { category: 'Puzzles', topic: 'Arrangement' }
  ],
  verbal: [
    { category: 'Vocabulary', topic: 'Synonyms' },
    { category: 'Grammar', topic: 'Error Spotting' },
    { category: 'Reading', topic: 'Comprehension' },
    { category: 'Vocabulary', topic: 'Antonyms' }
  ]
}

function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)] }

function generateAptitude(i){
  // simple arithmetic/algebra questions
  const t = topics.aptitude[i % topics.aptitude.length]
  const difficulty = i % 3 === 0 ? 'easy' : (i % 3 === 1 ? 'medium' : 'hard')
  const a = Math.floor(Math.random()*20)+1
  const b = Math.floor(Math.random()*20)+1
  const opList = ['+','-','*','/']
  const op = randChoice(opList)
  let text, correct
  if (op === '+'){ text = `What is ${a} + ${b}?`; correct = a+b }
  else if (op === '-'){ text = `What is ${a+b} - ${a}?`; correct = b }
  else if (op === '*'){ text = `What is ${a} × ${b}?`; correct = a*b }
  else { const aa = a*b; text = `What is ${aa} ÷ ${a}?`; correct = b }

  const opts = [correct, correct + 1, correct - 1, correct + 2].map(n=>String(n))
  const correctIndex = 0
  return {
    module: 'aptitude', category: t.category, topic: t.topic, difficulty,
    text, options: opts.map(o=>({ text: o })), correctIndex, explanation: `Compute ${text.replace('What is ','')}`,
    marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
    negativeMarks: 0.25
  }
}

function generateReasoning(i){
  const t = topics.reasoning[i % topics.reasoning.length]
  const difficulty = i % 3 === 0 ? 'easy' : (i % 3 === 1 ? 'medium' : 'hard')
  // simple sequence/pattern questions
  const start = Math.floor(Math.random()*10)+1
  const step = (i%5)+1
  const seq = [start, start+step, start+2*step, start+3*step]
  const missingIndex = Math.floor(Math.random()*4)
  const correct = seq[missingIndex]
  const text = `Find the missing number in the series: ${seq.map((v,idx)=> idx===missingIndex? '___': v).join(', ')}`
  const opts = [correct, correct+step, correct-step, correct+2*step].map(n=>String(n))
  return {
    module: 'reasoning', category: t.category, topic: t.topic, difficulty,
    text, options: opts.map(o=>({ text: o })), correctIndex: 0, explanation: `Sequence increases by ${step}.` , marks: difficulty==='easy'?1:(difficulty==='medium'?2:3), negativeMarks:0.25
  }
}

const vocab = ['happy','quick','bright','calm','ancient','brave','eager','fierce']
const synonyms = { happy: 'joyful', quick: 'fast', bright: 'smart', calm: 'serene', ancient: 'old', brave: 'courageous', eager: 'enthusiastic', fierce: 'ferocious' }

function generateVerbal(i){
  const t = topics.verbal[i % topics.verbal.length]
  const difficulty = i % 3 === 0 ? 'easy' : (i % 3 === 1 ? 'medium' : 'hard')
  const word = vocab[i % vocab.length]
  const correct = synonyms[word]
  const opts = [correct, 'sad', 'slow', 'bright']
  return {
    module: 'verbal', category: t.category, topic: t.topic, difficulty,
    text: `Choose the synonym of '${word}'.`, options: opts.map(o=>({ text: o })), correctIndex:0,
    explanation: `The synonym of ${word} is ${correct}.`, marks: difficulty==='easy'?1:(difficulty==='medium'?2:3), negativeMarks:0
  }
}

function generateAll(countPerModule=40){
  const out = []
  for (let i=0;i<countPerModule;i++) out.push(generateAptitude(i))
  for (let i=0;i<countPerModule;i++) out.push(generateReasoning(i))
  for (let i=0;i<countPerModule;i++) out.push(generateVerbal(i))
  return out
}

module.exports = { generateAll }

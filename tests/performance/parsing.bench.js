import { bench, describe } from 'vitest'
import { parseJsonl, parseFileContent, sortMessagesByTimestamp, getMessageStats } from '@/utils/logParser.js'

describe('JSONL Parsing Performance', () => {
  const smallJsonl = Array.from({ length: 100 }, (_, i) => 
    JSON.stringify({ uuid: `${i + 1}`, type: 'user', message: { content: `Message ${i + 1}` } })
  ).join('\n')

  const mediumJsonl = Array.from({ length: 1000 }, (_, i) => 
    JSON.stringify({ uuid: `${i + 1}`, type: 'user', message: { content: `Message ${i + 1}` } })
  ).join('\n')

  const largeJsonl = Array.from({ length: 10000 }, (_, i) => 
    JSON.stringify({ uuid: `${i + 1}`, type: 'user', message: { content: `Message ${i + 1}` } })
  ).join('\n')

  const complexJsonl = Array.from({ length: 1000 }, (_, i) => 
    JSON.stringify({
      uuid: `${i + 1}`,
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: `Complex message ${i + 1}` },
          { type: 'tool_use', name: 'Bash', input: { command: `command-${i}` } }
        ]
      },
      toolUseResult: {
        type: 'Bash',
        content: `Output for command ${i}`.repeat(10)
      },
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
    })
  ).join('\n')

  bench('parse small JSONL (100 messages)', async () => {
    await parseJsonl(smallJsonl)
  })

  bench('parse medium JSONL (1000 messages)', async () => {
    await parseJsonl(mediumJsonl)
  })

  bench('parse large JSONL (10000 messages)', async () => {
    await parseJsonl(largeJsonl)
  })

  bench('parse complex JSONL (1000 complex messages)', async () => {
    await parseJsonl(complexJsonl)
  })

  bench('parse file content (simulated)', async () => {
    const file = createMockFile(mediumJsonl, 'test.jsonl')
    await parseFileContent(file)
  })
})

describe('Message Processing Performance', () => {
  const messages = Array.from({ length: 10000 }, (_, i) => ({
    uuid: `${i + 1}`,
    type: 'user',
    _role: 'user',
    _tools: i % 3 === 0 ? ['Bash'] : [],
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
  }))

  bench('sort messages by timestamp (10000 messages)', () => {
    sortMessagesByTimestamp(messages)
  })

  bench('calculate message statistics (10000 messages)', () => {
    getMessageStats(messages)
  })

  bench('filter messages by role (10000 messages)', () => {
    messages.filter(m => m._role === 'user')
  })

  bench('search messages by content (10000 messages)', () => {
    messages.filter(m => m.message?.content?.toLowerCase().includes('test'))
  })
})

describe('Memory Usage Benchmarks', () => {
  bench('memory usage - large dataset parsing', async () => {
    const largeDataset = Array.from({ length: 50000 }, (_, i) => 
      JSON.stringify({
        uuid: `${i + 1}`,
        type: 'user',
        message: { content: `Message content ${i + 1}`.repeat(5) },
        timestamp: new Date().toISOString()
      })
    ).join('\n')

    const startMemory = process.memoryUsage().heapUsed
    await parseJsonl(largeDataset)
    const endMemory = process.memoryUsage().heapUsed
    
    const memoryIncrease = endMemory - startMemory
    // Log memory usage for analysis
    console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`)
  })
})

describe('Error Handling Performance', () => {
  const jsonlWithErrors = Array.from({ length: 1000 }, (_, i) => {
    if (i % 10 === 0) {
      return 'invalid json line'
    }
    return JSON.stringify({ uuid: `${i + 1}`, type: 'user' })
  }).join('\n')

  bench('parse JSONL with 10% error rate', async () => {
    await parseJsonl(jsonlWithErrors)
  })

  bench('validate messages (mixed valid/invalid)', () => {
    const mixedMessages = [
      { uuid: '1', type: 'user' },
      null,
      { uuid: '2' },
      undefined,
      { type: 'assistant' },
      {},
      { message: 'content' }
    ]

    mixedMessages.forEach(msg => {
      // Inline validation for benchmarking
      if (!msg || typeof msg !== 'object') return false
      if (!msg.uuid && !msg.type && !msg.message) return false
      return true
    })
  })
})
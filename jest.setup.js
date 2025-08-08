// Jest setup file for Excel Mock Interviewer tests

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Global test utilities
global.mockSpreadsheetData = {
  sheets: [{
    name: 'Test Sheet',
    data: [
      [{ v: 'Header 1' }, { v: 'Header 2' }],
      [{ v: 'Data 1' }, { v: 'Data 2' }]
    ],
    config: {}
  }],
  metadata: {
    created_at: new Date(),
    version: '1.0'
  }
}

global.mockUserAction = {
  timestamp: Date.now(),
  type: 'cell_edit',
  cell_reference: 'A1',
  old_value: null,
  new_value: 'Test Value',
  action_data: {}
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
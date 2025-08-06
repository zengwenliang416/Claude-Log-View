import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/tailwind.css'
import './assets/styles/variables.css'
import './assets/styles/reset.css'
import './assets/styles/highlight.css'

// Initialize application configuration and logging
import { configManager } from './utils/ConfigurationManager.js'
import { logger } from './utils/logger.js'

// Validate configuration at startup
const validationResult = configManager.validateConfiguration()

if (!validationResult.valid) {
  logger.error('Application configuration validation failed', {
    component: 'main',
    errors: validationResult.errors
  })
  
  if (configManager.isProduction()) {
    console.error('Application startup failed due to configuration errors:', validationResult.errors)
  }
} else {
  logger.info('Application configuration validated successfully', {
    component: 'main',
    environment: configManager.getEnvironment(),
    summary: configManager.getSummary()
  })
}

// Log startup information
logger.info('Claude Log Viewer starting', {
  component: 'main',
  version: configManager.get('APP_VERSION'),
  environment: configManager.getEnvironment(),
  buildDate: configManager.get('BUILD_DATE')
})

createApp(App).mount('#app')
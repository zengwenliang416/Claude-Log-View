import { mount } from '@vue/test-utils'
import { createApp } from 'vue'
import LogViewer from './src/components/LogViewer.vue'

console.log('Testing LogViewer component...')

try {
  const app = createApp({
    template: '<LogViewer />',
    components: { LogViewer }
  })
  
  console.log('Vue app created successfully')
} catch (error) {
  console.error('Error creating Vue app:', error)
  console.error('Stack trace:', error.stack)
}
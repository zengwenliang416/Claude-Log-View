<template>
  <div id="app" class="app-container">
    <!-- 🚀 超级炫酷的 3D 背景 -->
    <ThreeBackground 
      :theme="theme.isDark ? 'dark' : 'light'"
      :intensity="1.2"
      :speed="0.8"
    />
    
    <!-- Glassmorphism Background with Gradient (作为备用) -->
    <div class="app-background">
      <div class="gradient-orb gradient-orb-1"></div>
      <div class="gradient-orb gradient-orb-2"></div>
      <div class="gradient-orb gradient-orb-3"></div>
    </div>
    
    <!-- Main Application Content -->
    <div class="app-content">
      <LogViewer />
    </div>
    
    <!-- Notification System Container -->
    <div id="notifications" class="notification-container"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme.js'
import { useScrollPerformance } from '@/composables/useScrollPerformance.js'
import LogViewer from './components/LogViewer.vue'
import ThreeBackground from './components/ui/ThreeBackground.vue'

// Initialize theme system
const theme = useTheme()

// Initialize scroll performance optimizations
const { createScrollListener } = useScrollPerformance({
  enableBlurReduction: true,
  enableClassToggle: true,
  throttleMs: 16
})

onMounted(() => {
  // Set up global scroll performance monitoring
  const cleanupScrollListener = createScrollListener()
  
  // Application initialized with performance optimizations
  
  return () => {
    cleanupScrollListener()
  }
})
</script>

<style scoped>
.app-container {
  @apply relative min-h-screen w-full overflow-hidden;
  /* 确保整个应用不产生滚动条 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.app-background {
  @apply fixed inset-0 -z-20;
  @apply bg-gradient-to-br from-gray-50 via-white to-gray-100;
  @apply dark:from-gray-900 dark:via-gray-800 dark:to-gray-900;
  @apply transition-all duration-300 ease-out;
  /* 降低不透明度，让3D背景更突出 */
  opacity: 0.3;
}

/* Floating gradient orbs for modern background effect */
.gradient-orb {
  @apply absolute rounded-full blur-3xl opacity-20;
  @apply animate-pulse;
  animation-duration: 8s;
}

.gradient-orb-1 {
  @apply w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-500;
  @apply -top-48 -left-48;
  @apply dark:from-blue-600 dark:to-purple-700;
  animation-delay: 0s;
}

.gradient-orb-2 {
  @apply w-80 h-80 bg-gradient-to-r from-green-400 to-blue-500;
  @apply top-1/2 -right-40;
  @apply dark:from-green-600 dark:to-blue-700;
  animation-delay: 2s;
}

.gradient-orb-3 {
  @apply w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-500;
  @apply -bottom-36 left-1/3;
  @apply dark:from-purple-600 dark:to-pink-700;
  animation-delay: 4s;
}

.app-content {
  @apply relative z-10 h-screen w-full;
  /* 增强玻璃态效果，与3D背景完美融合 */
  backdrop-filter: blur(20px) saturate(180%) brightness(1.1);
  background: rgba(255, 255, 255, 0.1);
  /* Performance optimization: use transform for GPU acceleration */
  transform: translateZ(0);
  will-change: backdrop-filter;
  contain: layout style;
  /* 添加微妙的边框效果 */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0;
}

.dark .app-content {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Reduce backdrop-filter during scroll for performance */
.scrolling .app-content {
  backdrop-filter: blur(8px) saturate(120%);
  transition: backdrop-filter 200ms ease-out;
}

.notification-container {
  @apply fixed top-4 right-4 z-50;
  @apply pointer-events-none;
}

/* Enhanced animations for modern feel */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(1deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
}

.gradient-orb {
  animation: float 12s ease-in-out infinite;
}

.gradient-orb-2 {
  animation: float 14s ease-in-out infinite reverse;
}

.gradient-orb-3 {
  animation: float 16s ease-in-out infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .gradient-orb {
    @apply w-48 h-48;
  }
  
  .gradient-orb-1 {
    @apply -top-24 -left-24;
  }
  
  .gradient-orb-2 {
    @apply w-40 h-40 -right-20;
  }
  
  .gradient-orb-3 {
    @apply w-36 h-36;
    bottom: -4.5rem;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .gradient-orb {
    animation: none;
  }
  
  .app-background {
    transition: none;
  }
}
</style>
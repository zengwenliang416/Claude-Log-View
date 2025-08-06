import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Read package.json for version info
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig(({ mode, command }) => {
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'
  const isTest = mode === 'test'
  const isBuild = command === 'build'

  console.log(`🔧 Building for ${mode} environment (${command})`)

  return {
    plugins: [
      vue({
        // Production optimizations for Vue
        template: {
          compilerOptions: {
            // Remove whitespace in production
            whitespace: isProduction ? 'condense' : 'preserve'
          }
        }
      }),
      
      // Development-only plugins
      ...(isDevelopment ? [
        // Add development plugins here if needed
      ] : []),
      
      // Production-only plugins
      ...(isProduction ? [
        // Add production plugins here if needed
      ] : [])
    ],
    
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@/components': resolve(__dirname, 'src/components'),
        '@/composables': resolve(__dirname, 'src/composables'),
        '@/utils': resolve(__dirname, 'src/utils'),
        '@/assets': resolve(__dirname, 'src/assets')
      }
    },
    
    // Build-time environment variables
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __IS_PRODUCTION__: isProduction,
      __IS_DEVELOPMENT__: isDevelopment,
      __IS_TEST__: isTest,
      __ENABLE_DEBUG__: !isProduction,
      
      // Performance monitoring flags
      __ENABLE_PERFORMANCE_MONITORING__: !isProduction,
      __ENABLE_VUE_DEVTOOLS__: isDevelopment,
      
      // Feature flags (can be overridden by environment variables)
      __FEATURE_3D_BACKGROUND__: JSON.stringify(process.env.VITE_ENABLE_3D_BACKGROUND !== 'false'),
      __FEATURE_VIRTUAL_SCROLLING__: JSON.stringify(process.env.VITE_FEATURE_VIRTUAL_SCROLLING !== 'false'),
      __FEATURE_ADVANCED_CACHING__: JSON.stringify(process.env.VITE_FEATURE_MESSAGE_CACHING !== 'false')
    },
    
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      // CSS preprocessing optimizations
      preprocessorOptions: {
        scss: {
          // Add global SCSS variables/mixins if needed
        }
      },
      // Production CSS optimizations
      ...(isProduction ? {
        devSourcemap: false
      } : {})
    },
    
    build: {
      // Production build optimizations
      minify: isProduction ? 'terser' : false,
      sourcemap: isProduction ? false : 'inline',
      
      // Target modern browsers for better optimization
      target: isProduction ? 'es2020' : 'esnext',
      
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
      
      rollupOptions: {
        // Code splitting configuration
        output: {
          // Manual chunks for better caching
          manualChunks: {
            // Vendor libraries
            'vendor-vue': ['vue'],
            'vendor-three': ['three'],
            'vendor-ui': ['lucide-vue-next', 'radix-vue'],
            'vendor-utils': ['@vueuse/core', 'highlight.js', 'marked'],
            
            // Application chunks
            'app-components': [
              './src/components/ui/ThreeBackground.vue',
              './src/components/ui/Button.vue',
              './src/components/ui/Card.vue'
            ],
            'app-utils': [
              './src/utils/MessageContentCache.js',
              './src/utils/FilteringEngine.js',
              './src/utils/logger.js'
            ]
          },
          
          // Chunk naming for better caching
          chunkFileNames: (chunkInfo) => {
            if (isProduction) {
              return 'assets/js/[name]-[hash].js'
            }
            return 'assets/js/[name].js'
          },
          
          entryFileNames: (chunkInfo) => {
            if (isProduction) {
              return 'assets/js/[name]-[hash].js'
            }
            return 'assets/js/[name].js'
          },
          
          assetFileNames: (assetInfo) => {
            if (isProduction) {
              if (assetInfo.name.endsWith('.css')) {
                return 'assets/css/[name]-[hash][extname]'
              }
              return 'assets/[ext]/[name]-[hash][extname]'
            }
            return 'assets/[name][extname]'
          }
        },
        
        // External dependencies (don't bundle)
        external: isProduction ? [] : [
          // Development externals if needed
        ]
      },
      
      // Terser options for production
      terserOptions: isProduction ? {
        compress: {
          // Remove console.* in production except errors
          drop_console: true,
          drop_debugger: true,
          
          // Remove unused code
          dead_code: true,
          
          // Optimize comparisons
          comparisons: true,
          
          // Optimize conditionals
          conditionals: true,
          
          // Inline simple functions
          inline: 2
        },
        mangle: {
          // Mangle property names for better compression
          properties: {
            regex: /^_/
          }
        },
        format: {
          // Remove comments
          comments: false
        }
      } : {},
      
      // Production-specific optimizations
      ...(isProduction ? {
        // Enable CSS code splitting
        cssCodeSplit: true,
        
        // Reduce bundle size
        reportCompressedSize: true,
        
        // Optimize dependencies
        commonjsOptions: {
          transformMixedEsModules: true
        }
      } : {})
    },
    
    // Development server configuration
    server: {
      port: 3000,
      open: isDevelopment,
      cors: true,
      
      // Development-only features
      ...(isDevelopment ? {
        hmr: {
          overlay: true
        }
      } : {})
    },
    
    // Preview server configuration (for production preview)
    preview: {
      port: 3000,
      open: true
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: [
        'vue',
        'three',
        '@vueuse/core',
        'highlight.js',
        'marked',
        'lucide-vue-next',
        'radix-vue'
      ],
      
      // Exclude from optimization
      exclude: [
        // Add packages to exclude if needed
      ],
      
      // Force optimization for specific packages
      force: isBuild
    },
    
    // Environment-specific configurations
    ...(isDevelopment ? {
      // Development-only configurations
      esbuild: {
        sourcemap: 'inline'
      }
    } : {}),
    
    ...(isProduction ? {
      // Production-only configurations
      esbuild: {
        // Remove console.log in production builds
        drop: ['console', 'debugger'],
        legalComments: 'none'
      }
    } : {}),
    
    ...(isTest ? {
      // Test environment configurations
      test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['./tests/setup.js']
      }
    } : {})
  }
})
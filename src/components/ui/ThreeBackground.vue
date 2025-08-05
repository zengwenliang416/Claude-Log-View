<template>
  <div ref="containerRef" class="three-background">
    <canvas ref="canvasRef" class="three-canvas" />
    <!-- 炫酷的加载指示器 -->
    <div v-if="!isLoaded" class="loading-overlay">
      <div class="loading-animation">
        <div class="pulse-rings">
          <div class="pulse-ring pulse-ring-1"></div>
          <div class="pulse-ring pulse-ring-2"></div>
          <div class="pulse-ring pulse-ring-3"></div>
        </div>
        <div class="loading-text">Initializing 3D Universe...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  theme: {
    type: String,
    default: 'light'
  },
  intensity: {
    type: Number,
    default: 1.0
  },
  speed: {
    type: Number,
    default: 1.0
  }
})

// Refs
const containerRef = ref(null)
const canvasRef = ref(null)
const isLoaded = ref(false)

// Three.js objects
let scene, camera, renderer, animationId
let particleSystem, geometryBalls, waveGeometry
let mouse = { x: 0, y: 0 }
let targetMouse = { x: 0, y: 0 }

// 炫酷的粒子系统
const createParticleSystem = () => {
  const particleCount = 2000
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    
    // 创建螺旋星云效果
    const radius = Math.random() * 15 + 5
    const angle = (i / particleCount) * Math.PI * 8
    const height = (Math.random() - 0.5) * 10
    
    positions[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 2
    positions[i3 + 1] = height + Math.sin(angle * 0.5) * 2
    positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 2
    
    // 炫酷的颜色渐变
    const hue = (angle + Math.PI) / (Math.PI * 2)
    const saturation = 0.8 + Math.random() * 0.2
    const lightness = 0.6 + Math.random() * 0.3
    
    const color = new THREE.Color().setHSL(hue, saturation, lightness)
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
    
    sizes[i] = Math.random() * 3 + 1
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      pixelRatio: { value: window.devicePixelRatio },
      theme: { value: props.theme === 'dark' ? 1.0 : 0.0 }
    },
    vertexShader: `
      attribute float size;
      uniform float time;
      uniform float pixelRatio;
      uniform float theme;
      varying vec3 vColor;
      
      void main() {
        vColor = color;
        
        vec3 pos = position;
        pos.x += sin(time * 0.5 + position.y * 0.1) * 0.5;
        pos.z += cos(time * 0.3 + position.x * 0.1) * 0.5;
        pos.y += sin(time * 0.7 + position.z * 0.1) * 0.3;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z) * (theme * 0.5 + 0.5);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float theme;
      varying vec3 vColor;
      
      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        
        if (dist > 0.5) discard;
        
        float alpha = 1.0 - (dist * 2.0);
        alpha = pow(alpha, 2.0);
        
        vec3 finalColor = vColor;
        finalColor += sin(time * 2.0) * 0.1;
        finalColor = mix(finalColor, finalColor * 1.5, theme);
        
        gl_FragColor = vec4(finalColor, alpha * (theme * 0.7 + 0.3));
      }
    `,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  })
  
  return new THREE.Points(geometry, material)
}

// 炫酷的几何球体
const createGeometryBalls = () => {
  const group = new THREE.Group()
  
  for (let i = 0; i < 5; i++) {
    const geometry = new THREE.IcosahedronGeometry(0.5 + Math.random() * 0.5, 2)
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
      transparent: true,
      opacity: 0.7,
      shininess: 100,
      wireframe: Math.random() > 0.5
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 20
    )
    
    mesh.userData = {
      originalPosition: mesh.position.clone(),
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02
      }
    }
    
    group.add(mesh)
  }
  
  return group
}

// 炫酷的波纹效果
const createWaveGeometry = () => {
  const geometry = new THREE.PlaneGeometry(30, 30, 150, 150)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      mouse: { value: new THREE.Vector2(0, 0) },
      theme: { value: props.theme === 'dark' ? 1.0 : 0.0 }
    },
    vertexShader: `
      uniform float time;
      uniform vec2 mouse;
      varying vec2 vUv;
      varying float vElevation;
      
      void main() {
        vUv = uv;
        
        vec3 pos = position;
        float elevation = sin(pos.x * 0.3 + time) * 0.5;
        elevation += sin(pos.y * 0.2 + time * 1.5) * 0.3;
        elevation += sin(distance(pos.xy, mouse * 10.0) * 0.5 - time * 2.0) * 0.4;
        
        pos.z = elevation;
        vElevation = elevation;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float theme;
      varying vec2 vUv;
      varying float vElevation;
      
      void main() {
        vec3 color1 = vec3(0.2, 0.6, 1.0);
        vec3 color2 = vec3(1.0, 0.3, 0.8);
        vec3 color3 = vec3(0.3, 1.0, 0.5);
        
        vec3 finalColor = mix(color1, color2, vUv.x);
        finalColor = mix(finalColor, color3, sin(vElevation * 2.0 + time) * 0.5 + 0.5);
        
        finalColor = mix(finalColor * 0.3, finalColor * 1.5, theme);
        
        float alpha = 0.1 + abs(vElevation) * 0.3;
        alpha = mix(alpha * 0.5, alpha, theme);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  })
  
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -8
  
  return mesh
}

// 初始化3D场景
const initThree = () => {
  if (!containerRef.value || !canvasRef.value) return
  
  const container = containerRef.value
  const canvas = canvasRef.value
  
  // Scene
  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x000000, 10, 50)
  
  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 5, 15)
  
  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  scene.add(directionalLight)
  
  const pointLight = new THREE.PointLight(0x00ffff, 1, 50)
  pointLight.position.set(-10, 10, -10)
  scene.add(pointLight)
  
  const pointLight2 = new THREE.PointLight(0xff00ff, 1, 50)
  pointLight2.position.set(10, -10, 10)
  scene.add(pointLight2)
  
  // Create 3D elements
  particleSystem = createParticleSystem()
  scene.add(particleSystem)
  
  geometryBalls = createGeometryBalls()
  scene.add(geometryBalls)
  
  waveGeometry = createWaveGeometry()
  scene.add(waveGeometry)
  
  // Mouse interaction
  container.addEventListener('mousemove', onMouseMove)
  
  isLoaded.value = true
  animate()
}

// 鼠标交互
const onMouseMove = (event) => {
  const rect = containerRef.value.getBoundingClientRect()
  targetMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  targetMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate)
  
  const time = Date.now() * 0.001 * props.speed
  
  // 平滑鼠标移动
  mouse.x += (targetMouse.x - mouse.x) * 0.05
  mouse.y += (targetMouse.y - mouse.y) * 0.05
  
  // 更新粒子系统
  if (particleSystem?.material?.uniforms) {
    particleSystem.material.uniforms.time.value = time
    particleSystem.rotation.y = time * 0.1
  }
  
  // 更新几何球体
  if (geometryBalls) {
    geometryBalls.children.forEach((ball, i) => {
      const { originalPosition, rotationSpeed } = ball.userData
      
      ball.position.x = originalPosition.x + Math.sin(time + i) * 2
      ball.position.y = originalPosition.y + Math.cos(time * 0.7 + i) * 1
      ball.position.z = originalPosition.z + Math.sin(time * 0.5 + i) * 2
      
      ball.rotation.x += rotationSpeed.x
      ball.rotation.y += rotationSpeed.y
      ball.rotation.z += rotationSpeed.z
    })
  }
  
  // 更新波纹
  if (waveGeometry?.material?.uniforms) {
    waveGeometry.material.uniforms.time.value = time
    waveGeometry.material.uniforms.mouse.value.set(mouse.x, mouse.y)
  }
  
  // 相机轻微摆动
  camera.position.x = Math.sin(time * 0.2) * 2
  camera.position.y = 5 + Math.cos(time * 0.3) * 1
  camera.lookAt(0, 0, 0)
  
  renderer.render(scene, camera)
}

// 响应式调整
const onResize = () => {
  if (!containerRef.value || !camera || !renderer) return
  
  const container = containerRef.value
  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.clientWidth, container.clientHeight)
}

// 主题切换
watch(() => props.theme, (newTheme) => {
  if (!scene) return
  
  const themeValue = newTheme === 'dark' ? 1.0 : 0.0
  
  // 更新材质主题
  if (particleSystem?.material?.uniforms) {
    particleSystem.material.uniforms.theme.value = themeValue
  }
  if (waveGeometry?.material?.uniforms) {
    waveGeometry.material.uniforms.theme.value = themeValue
  }
  
  // 更新雾的颜色
  scene.fog.color.setHex(newTheme === 'dark' ? 0x000000 : 0x222222)
})

// 生命周期
onMounted(() => {
  setTimeout(() => {
    initThree()
    window.addEventListener('resize', onResize)
  }, 100)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (containerRef.value) {
    containerRef.value.removeEventListener('mousemove', onMouseMove)
  }
  window.removeEventListener('resize', onResize)
  
  // 清理Three.js资源
  if (renderer) {
    renderer.dispose()
  }
  if (scene) {
    scene.traverse((object) => {
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose())
        } else {
          object.material.dispose()
        }
      }
      if (object.geometry) {
        object.geometry.dispose()
      }
    })
  }
})
</script>

<style scoped>
.three-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: auto;
}

.three-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-animation {
  text-align: center;
  color: white;
}

.pulse-rings {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(59, 130, 246, 0.6);
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
}

.pulse-ring-1 {
  width: 40px;
  height: 40px;
  animation-delay: 0s;
}

.pulse-ring-2 {
  width: 70px;
  height: 70px;
  animation-delay: 0.5s;
}

.pulse-ring-3 {
  width: 100px;
  height: 100px;
  animation-delay: 1s;
}

@keyframes pulse-ring {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.8);
  }
  50% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.4);
  }
}

.loading-text {
  font-size: 1.2rem;
  font-weight: 600;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899);
  background-size: 200% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 3s ease-in-out infinite;
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .three-background {
    pointer-events: none;
  }
}

/* 性能优化 */
@media (prefers-reduced-motion: reduce) {
  .pulse-ring,
  .loading-text {
    animation: none;
  }
}
</style>
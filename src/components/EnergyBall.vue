<template>
  <!-- 能量球外层容器 -->
  <div class="energy-ball-container">
    <span class="draw-count">今日剩余抽奖：{{ remainingDraws }}次</span>
    <div class="energy-ball" :style="{ background: `conic-gradient(#42b983 ${energyPercent}%, #f5f5f5 0%)` }">
      <div class="energy-core">
        <span class="energy-text">{{ energyPercent }}%</span>
      </div>
    </div>
    <!-- 抽奖弹窗（支持加载中、结果展示） -->
    <div class="draw-modal" v-if="showDrawModal">
      <div class="modal-content">
        <h3>🎉 恭喜获得抽奖机会！</h3>
        <!-- 加载中状态（AI 生成时显示） -->
        <div v-if="isGenerating" class="loading">生成专属激励中...</div>
        <!-- 结果展示状态 -->
        <p v-else>{{ drawResult }}</p>
        <button @click="closeDrawModal" class="confirm-btn" :disabled="isGenerating">
          {{ isGenerating ? '生成中...' : '确认' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { generateAIMotivation } from '@/utils/aiUtils'; // 导入 Qwen AI 生成函数

// 接收父组件传递的属性
const props = defineProps({
  energyPercent: {
    type: Number,
    default: 0,
    required: true
  },
  remainingDraws: {
    type: Number,
    default: 3,
    required: true
  }
})

// 抽奖相关状态
const showDrawModal = ref(false)
const drawResult = ref('')
const isGenerating = ref(false) // 新增：AI 生成加载状态
// 保留原有奖品池（作为 AI 生成失败的兜底）
const prizes = ['今天的你也是最棒哒', '幸运加持✨', '勇敢向前冲', '吃点好的奖励自己吧', '任务完成，休息一下！']
// 控制「再来一次」的概率（10% 概率，可调整）
const EXTRA_DRAW_PROBABILITY = 0.1

// 监听能量值变化，满100%且有抽奖次数时触发抽奖
watch(
  () => props.energyPercent,
  (newVal) => {
    if (isNaN(newVal)) return
    if (newVal >= 100 && props.remainingDraws > 0) {
      startDraw()
    }
  }
)

// 开始抽奖（核心修改：AI 优先 + 兜底 + 再来一次）
const startDraw = async () => {
  isGenerating.value = true // 开启加载中
  showDrawModal.value = true

  try {
    // 1. 先尝试调用 AI 生成个性化文案
    const aiText = await generateAIMotivation()

    // 2. 随机判断是否为「再来一次」（保留原有功能）
    const isExtraDraw = Math.random() < EXTRA_DRAW_PROBABILITY
    if (isExtraDraw) {
      drawResult.value = '再来一次（已存入次数）✨'
    } else {
      drawResult.value = aiText // AI 生成成功，用 AI 文案
    }

  } catch (error) {
    // 3. AI 生成失败（网络问题/API 错误），使用原有 prizes 兜底
    console.error('AI 生成失败，使用兜底文案：', error)
    const randomIndex = Math.floor(Math.random() * prizes.length)
    drawResult.value = prizes[randomIndex]
  } finally {
    isGenerating.value = false // 关闭加载中
    // 通知父组件重置能量并更新抽奖次数（只有非「再来一次」才减少次数）
    emit('draw-completed', drawResult.value === '再来一次（已存入次数）✨')
  }
}

// 关闭抽奖弹窗
const closeDrawModal = () => {
  showDrawModal.value = false
  drawResult.value = '' // 清空结果，避免下次打开重复显示
}

// 向父组件传递事件
const emit = defineEmits(['draw-completed'])
</script>

<style scoped>
/* 原有样式不变，新增加载中动画样式 */
.loading {
  font-size: 16px;
  color: #666;
  margin: 16px 0;
  animation: flash 1s infinite alternate;
}

@keyframes flash {
  from { opacity: 0.6; }
  to { opacity: 1; }
}

/* 禁用按钮样式（加载中时按钮不可点击） */
.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 原有样式保持不变... */
.energy-ball-container {
  position: relative;
  width: 120px;
  height: 60px;
  margin-left: auto;
}

.energy-ball {
  width: 50%;
  height: 80%;
  margin-left: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
  transition: background 0.3s ease;
}

.energy-core {
  width: 80%;
  height: 80%;
  background: #fff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.1);
}

.energy-text {
  font-size: 20px;
  font-weight: bold;
  color: #42b983;
}

.draw-count {
  font-size: 6px;
  color: #666;
  margin-top: -20px;
  margin-right: -10px;
  display: inline-block;
  vertical-align: middle;
}

.draw-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.modal-content h3 {
  color: #42b983;
  margin-bottom: 16px;
}

.modal-content p {
  font-size: 16px;
  margin-bottom: 20px;
  color: #333;
}

.confirm-btn {
  padding: 8px 24px;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-btn:hover {
  background: #359469;
}
</style>
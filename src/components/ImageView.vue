<template>
  <!--点击图片的其余灰色部分也会触发关闭-->
  <div 
    class="image-modal" 
    v-if="visible"
    @click="$emit('close')"
  >
    <div class="modal-content" @click.stop>
      <!--关闭按钮-->
      <button class="close-modal" @click="$emit('close')">×</button>
     
      <!-- 画笔工具条 -->
      <div class="draw-tools" v-if="isEditing">
        <label>颜色: </label>
        <input type="color" v-model="drawColor" class="color-picker">

        <label>粗细: </label>
        <input type="number" v-model="lineWidth" min="1" max="20" class="line-width">

        <button @click="saveDrawing" class="save-btn">保存编辑</button>
        <button @click="cancelDrawing" class="cancel-btn">取消编辑</button>
    </div>

    <!-- 编辑按钮（非编辑状态显示） -->
      <button 
        class="edit-btn" 
        v-if="!isEditing"
        @click="startEditing"
      >
        🖌️
      </button>
  <!-- 画布容器（图片+canvas叠加） -->
      <div class="canvas-container">
      <img 
        :src="imageUrl" 
        alt="图片预览" 
        class="modal-img"
         ref="imageRef"
        @load="initCanvas" 
      >
       <canvas 
          ref="canvasRef" 
          class="drawing-canvas"
          @mousedown="startDraw"
          @mousemove="draw"
          @mouseup="endDraw"
          @mouseleave="endDraw"
        ></canvas>
    </div>
  </div>
   </div>
</template>

<script setup>
import { defineProps, defineEmits,onMounted, watch,ref } from 'vue'

//子组件：图片查看器，需要传给父组件
//先确定待办是哪条，再确定图片是待办中的第几张
//因为待办有很多条，一个待办里可能不止一张图
const props = defineProps({
  visible: Boolean,
  imageUrl: String,
  // 接收图片在待办中的索引（用于保存时定位）
  todoIndex: Number,
  imgIndex: Number
})

const emit = defineEmits(['close', 'update-image'])

// 画笔状态
const isEditing = ref(false)
const drawColor = ref('#ff0000') // 默认红色
const lineWidth = ref(3) // 默认粗细
const isDrawing = ref(false)
const canvasRef = ref(null)
const imageRef = ref(null)
const ctx = ref(null) // 2D绘图上下文

// 初始化画布
const initCanvas = () => {
  if (!canvasRef.value || !imageRef.value) return
  
  const canvas = canvasRef.value
  const img = imageRef.value
  
  // 设置画布尺寸与图片一致
  canvas.width = img.offsetWidth
  canvas.height = img.offsetHeight
  
  // 获取2D上下文
  ctx.value = canvas.getContext('2d')
  ctx.value.lineCap = 'round' // 线条末端圆润

  // 将原图绘制到canvas上
  ctx.value.drawImage(img, 0, 0, canvas.width, canvas.height);
}

// 开始绘制
const startDraw = (e) => {
  if (!isEditing.value || !ctx.value) return
  isDrawing.value = true
  const { offsetX, offsetY } = e
  ctx.value.beginPath()
  ctx.value.moveTo(offsetX, offsetY)
  ctx.value.strokeStyle = drawColor.value
  ctx.value.lineWidth = lineWidth.value
}

// 绘制中
const draw = (e) => {
  if (!isDrawing.value || !ctx.value) return // 非编辑状态或无上下文
  const { offsetX, offsetY } = e// 相对于canvas的坐标
  ctx.value.lineTo(offsetX, offsetY)
  ctx.value.stroke()// 绘制路径
}

// 结束绘制
const endDraw = () => {
  if (isDrawing.value) {
    isDrawing.value = false
  }
}

// 开始编辑
const startEditing = () => {
  isEditing.value = true
  // 延迟初始化画布（确保图片已加载）
  setTimeout(initCanvas, 100)
}

// 取消编辑
const cancelDrawing = () => {
  isEditing.value = false
  // 清空画布
  if (ctx.value && canvasRef.value) {
    ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

// 保存编辑（将canvas转为图片并更新到待办）
const saveDrawing = () => {
  if (!canvasRef.value) return
  // 将画布内容转为base64图片
  const editedImageUrl = canvasRef.value.toDataURL('image/png')
  // 触发事件，通知父组件更新图片
  emit('update-image', {
    todoIndex: props.todoIndex,
    imgIndex: props.imgIndex,
    url: editedImageUrl
  })
  isEditing.value = false
}

// 监听图片切换，重置画布
watch(
  () => props.imageUrl,//第一个参数：监听的目标
  () => {// 第二个参数：变化时执行的回调函数
    isEditing.value = false
    if (ctx.value && canvasRef.value) {
      ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    }
  }
)
</script>

<style scoped>
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.modal-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 4px;
}

.close-modal {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ff4444;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.draw-tools {
  position: absolute;
  top: -60px;
  left: 0;
  display: flex;
  gap: 15px;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 15px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.color-picker {
  width: 30px;
  height: 30px;
  border: none;
  padding: 0;
  cursor: pointer;
}

.line-width {
  width: 60px;
  padding: 3px 5px;
}

.save-btn, .cancel-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.save-btn {
  background: #42b983;
  color: white;
}

.cancel-btn {
  background: #ff4444;
  color: white;
}

.edit-btn {
  position: absolute;
  top: -45px;
  right: 0;
  width: 60px;
  height: 30px;
  border-radius: 50%;
  background: none;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.canvas-container {
  position: relative;
  display: inline-block;
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
  border: 4px solid transparent; /* 与图片边框对齐 */
  border-radius: 4px;
}

/* 适配移动端 */
@media (max-width: 600px) {
  .draw-tools {
    top: auto;
    bottom: -70px;
    flex-wrap: wrap;
    width: 100%;
    justify-content: center;
  }
  .edit-btn {
    top: -35px;
    right: -10px;
  }
   .close-modal {
    right: 0;
  }
}

</style>
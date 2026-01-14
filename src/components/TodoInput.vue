<template>
     <!-- 添加待办的输入框 -->
     <!--同时也给enter键绑定addTodo方法-->

  <div class="add-todo">

     <!--允许上传多个图片-->
     <!-- 图片按钮（支持多选） -->
     <!--@click.stop 是为了隔离按钮的点击行为，防止与父元素的事件冲突，保证上传图片功能的正常使用-->
    <button class="add-image-btn" @click.stop="handleButtonClick">🖼️</button>
    <input 
      type="file" 
      accept="image/*" 
      @change="handleNewImageUpload" 
      class="image-upload"
      ref="newImageInput"
      style="display: none;"
      multiple
    >

    <!-- 待办文本输入 -->
     <!--@input 事件用于实时更新 localNewTodo 变量，保持与输入框内容的同步(子组件像父组件同步数据)-->
    <input 
      type="text"
      v-model="localNewTodo" 
      placeholder="请输入待办事项..."
      @keyup.enter="handleAdd"
      @input="$emit('update-new-todo', localNewTodo)"
    >

    <!-- 日期时间选择 -->
     <!--@input实时更新localDueDate变量-->
    <input 
      type="date" 
      v-model="localDueDate" 
      class="date-input"
      @input="handleDateChange" 
    />

    <input 
      type="time" 
      v-model="localDueTime" 
      class="time-input" 
      step="300"
      @input="$emit('update-due-time', localDueTime)"
    />
    <button @click="handleAdd">添加</button>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted  } from 'vue'
// 引入新的日期工具函数
import { getToday, getCurrentTime } from '@/utils/dateUtils'
const props = defineProps({
  newTodo: String,
  newTodoDueDate: String,
  newTodoDueTime: String,
})

const emit = defineEmits([
  'add-todo', 
  'update-new-todo', 
  'update-due-date', 
  'update-due-time'
])

// 本地状态（初始化时设置为当前时间）
const localNewTodo = ref(props.newTodo || '')
const localDueDate = ref(props.newTodoDueDate || getToday())  // 默认今天
const localDueTime = ref(props.newTodoDueTime || getCurrentTime())  // 默认当前时间
const newImageInput = ref(null)
const newImageUrls = ref([])

// 组件挂载时确保时间初始化
onMounted(() => {
  // 同步初始时间到父组件
  emit('update-due-date', localDueDate.value)
  emit('update-due-time', localDueTime.value)
})

// 处理日期变化的方法
const handleDateChange = () => {
  // 1. 打印当前日期值
  //console.log('子组件 localDueDate 的值：', localDueDate.value)
  // 2. 触发事件传递给父组件（保持原逻辑）
  emit('update-due-date', localDueDate.value)
}



// 处理图片上传按钮点击（从点击图片按钮到触发图片选择框）
const handleButtonClick = () => {
 // console.log('图片按钮被点击了');
  newImageInput.value?.click();//点击图片选择框
}

// 处理图片上传
const handleNewImageUpload = (e) => {
  //console.log('change事件触发了！');
  const files = e.target.files;
  if (!files.length) {
    console.log('未选择任何文件');
    return;
  }
  //循环处理每一张图片
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) {//如果不是图片
      console.error('选择的不是图片文件:', file.name);
      return;
    }
  //把本地文件转换成网页可以使用的数据（比如字符串）。
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log('文件读取成功');
      newImageUrls.value.push(event.target.result);//把转换后的图片字符串存到 newImageUrls 数组里（后续用于显示图片）
    };
    reader.onerror = () => {
      console.error('文件读取失败！');
    };
    reader.readAsDataURL(file);//把文件转换为 DataURL 格式
  });
}

// 触发添加待办（其余的文本和日期都用的@input与父组件实时同步了）
//因为图片数据是一次性传递，只有点添加按钮时才会触发添加待办，而文本和日期是实时同步的，还没点添加就能看到
const handleAdd = () => {
  // 主动同步一次文本值到父组件（确保父组件拿到最新内容）
  emit('update-new-todo', localNewTodo.value);
  emit('add-todo', newImageUrls.value)
  // 添加后恢复为当前时间
  const nowDate = getToday()
  const nowTime = getCurrentTime()
  localNewTodo.value = ''
  localDueDate.value = nowDate
  localDueTime.value = nowTime
  newImageUrls.value = []
  
  // 同步恢复后的时间到父组件
  emit('update-due-date', nowDate)
  emit('update-due-time', nowTime)
  
}
</script>

<style scoped>
.add-todo {
  margin: 20px 0;
  display: flex;
  gap: 10px; /* 子项之间的间距 */
  flex-wrap: wrap;/* 子项超出容器宽度时换行 */
}

.add-image-btn {
  padding: 8px 12px;
  background: #f0fdf4;
  border: 1px solid #42b983;
  color: #42b983;
  border-radius: 4px;
  cursor: pointer;
  margin: 0 5px;
}

.add-todo input[type="text"] {
  flex: 1;
  padding: 8px;
  font-size: 16px;
  min-width: 200px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.date-input, .time-input {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.add-todo button {
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  white-space: nowrap;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .add-todo {
    flex-direction: column;
    align-items: stretch;/* 子项宽度拉伸以填充容器 */
  }
}
</style>
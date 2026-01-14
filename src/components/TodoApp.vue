<!--能量球的功能已完毕，可美化一下样式-->
<!--抽奖换成文字激励，这个可以用ai的api引入，下次再思考-->
<!-- 抽奖弹窗的音效-->
<!--部署到手机上-->

<template>
  <div class="todo-container">
  <!--能量球-->
  <EnergyBall
     :energy-percent="energyPercent"
     :remaining-draws="remainingDraws"
     @draw-completed="handleDrawCompleted"
     />

  <!--标题项-->
    <h2 style="color: rgba(0, 50, 50, 0.7); font-size:26px; padding-top: 20px;text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);">待办事项列表</h2>

    <!-- 搜索区域 -->
      <!-- 搜索图标和搜索框（点击切换显示） -->
    <div class="search-wrapper">
      <button class="search-icon" @click="toggleSearch">🔍</button>
       <!--当showSearch为true时显示搜索框-->
      <div class="search-todo" v-if="showSearch">
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="搜索待办事项..."
          @focus="isSearchFocused = true"
          @blur="handleSearchBlur"
        >
      </div>
    </div>

    <!-- 添加待办组件，组件通信 -->
     <!--【:属性名】v-bind是父组件 → 子组件 传数据（子组件用 props 接收）
     eg：父组件把自己的 newTodo 变量的值，传递给子组件 TodoInput，子组件通过 new-todo 这个 props 接收并使用。
     -->

     <!--【@事件名】v-on是子组件 → 父组件 传数据（子组件用 emit 触发，父组件用方法接收）
     eg：子组件（TodoInput.vue）中会通过 emit('add-todo', 数据) 触发这个事件（比如点击 “添加” 按钮时）。
父组件通过 @add-todo 监听这个事件，当事件触发时，执行父组件自己的 addTodo 方法，并接收子组件传递的数据
     -->

  <!--子组件中输入框内容变化时，会通过 emit('update-new-todo', 输入的内容) 触发事件，$event 就是子组件传递过来的新值（比如用户输入的待办文本）。
父组件通过 newTodo = $event 把这个新值同步到自己的 newTodo 变量中，实现 “子组件输入实时更新父组件数据” 的效果。-->
    <TodoInput 
      @add-todo="addTodo"
      :new-todo="newTodo"
      :new-todo-due-date="newTodoDueDate"
      :new-todo-due-time="newTodoDueTime"
      @update-new-todo="newTodo = $event"
      @update-due-date="newTodoDueDate = $event"
      @update-due-time="newTodoDueTime = $event"
    />

    <!-- 排序控制 -->
    <div class="sort-controls">
      <label>排序方式：</label>
      <select v-model="sortType" @change="sortTodos">
        <option value="dueDateTimeAsc">按截止时间（近→远）</option>
        <option value="dueDateTimeDesc">按截止时间（远→近）</option>
        <option value="default">默认顺序</option>
      </select>
    </div>

    <!-- 待办列表（使用筛选且排序后的列表） -->
     <!--循环渲染列表-->
     <!--{类名:条件}，当条件为true的时候添加该类-->
    <!-- 待办列表组件 -->
    <TodoList 
      :todos="filteredAndSortedTodos"
      :search-keyword="searchKeyword"
      @delete-todo="deleteTodo"
      @toggle-done="toggleDone"
      @edit-todo="editTodo"
      @update-date="updateTodoDate"
      @remove-image="removeImage"
      @open-image="openImageViewer"
    />

    <!-- 图片查看器组件 -->
     <!-- 增加当前图片所在的待办索引和处理编辑后的图片 -->
    <ImageViewer 
      :visible="showImageViewer"
      :image-url="currentImageUrl"
      @close="showImageViewer = false"
      :todo-index="currentTodoIndex"  
      :img-index="currentImgIndex"   
      @update-image="handleUpdateImage" 
    />

    <!-- 统计信息 -->
    <div class="todo-stats">
      剩余待办：{{ remainingCount }} 个 | 已完成：{{ completedCount }} 个 | 逾期：{{ overdueCount }} 个
    </div>
  </div>
</template>

<script setup>
import { ref, computed ,onMounted,watch} from 'vue'
import TodoInput from './TodoInput.vue'
import TodoList from './TodoList.vue'
import ImageViewer from './ImageView.vue'
// 引入新的日期工具函数
import { isOverdue, isSoonDue, getNow, getToday, getCurrentTime } from '@/utils/dateUtils'
import EnergyBall from './EnergyBall.vue'

//#region   定义基础数据
const newTodo = ref('')
const newTodoDueDate = ref(getToday())  // 默认今天
const newTodoDueTime = ref(getCurrentTime())  // 默认当前时间
const sortType = ref('dueDateTimeAsc')
const todos = ref([])
const showSearch = ref(false)
const searchKeyword = ref('')
const isSearchFocused = ref(false)
// 新增：记录当前打开的图片对应的索引
const currentTodoIndex = ref(-1)
const currentImgIndex = ref(-1)
// 图片查看器相关
const showImageViewer = ref(false)
const currentImageUrl = ref('')
//能量球与抽奖相关
const energyPercent=ref(0)
const remainingDraws=ref(3)//每日剩余的抽奖次数
const lastDrawDate=ref('')//上次抽奖日期（用于重置每天的次数）
//#endregion

//#region  数据持久化保存
//用localStorage实现数据持久化存储
//页面加载时从本地存储读取数据(读档)
onMounted(() => {
  try {
     // 1. 读取待办数据（原有逻辑）
    const savedTodos = localStorage.getItem('todos')
    if (savedTodos) {
      // 解析前先验证是否为有效JSON
      const parsed = JSON.parse(savedTodos)//把json字符串解析为js对象
      if (Array.isArray(parsed)) {//检查是否是一个数组（如果不是数组，直接赋值给todos会导致列表功能异常）
        todos.value = parsed
      }
    }
     // 2. 读取能量数据
    const savedEnergy = localStorage.getItem('energyData')
    if (savedEnergy) {
      const energyData = JSON.parse(savedEnergy)
      // 这里强制转数字+兜底（避免非数字）
      energyPercent.value = isNaN(Number(energyData.energyPercent)) ? 0 : Number(energyData.energyPercent)
      remainingDraws.value = isNaN(Number(energyData.remainingDraws)) ? 3 : Number(energyData.remainingDraws)
      lastDrawDate.value = energyData.lastDrawDate || getToday()
    } else {
      // 若没有能量数据，主动初始化默认值
      energyPercent.value = 0
      remainingDraws.value = 3
      lastDrawDate.value = getToday()
    }

      //3.检查是否跨天（需要重置每日的抽奖次数）
      checkAndResetDraws()
    
  } catch (e) {
    console.error('读取本地存储失败：', e)
    // 清除损坏的存储数据
    localStorage.removeItem('todos')
    localStorage.removeItem('energyData')
  }
})
//检查是否跨天（需要重置每日的抽奖次数）
const checkAndResetDraws=()=>{
  const today=getToday()
  if(lastDrawDate.value !== today){//如果上次抽奖日期不是今天
    remainingDraws.value=3//重置为3次
    lastDrawDate.value=today//更新为今天
  }
}
// 确保保存前数据可序列化（存档）
watch(
  todos,//要监视的对象
  (newTodos) => {//当todos变化时执行这个函数
    try {
      // 深拷贝一次，避免某些引用类型导致序列化失败
      const serializable = JSON.parse(JSON.stringify(newTodos))
      localStorage.setItem('todos', JSON.stringify(serializable))
    } catch (e) {
      console.error('保存到本地存储失败：', e)
    }
  },
  { deep: true }
)
//存入能量和抽奖状态变化，同步到本地
watch(
   [energyPercent,remainingDraws,lastDrawDate],//监听对象
   ([newEnergy,newDraws,newDate])=>{//当监听对象改变时触发的函数
      try{
        const safeEnergy=Number(newEnergy);
        const energyData={//用energyData对象来存这个数据
          energyPercent: safeEnergy,
          remainingDraws: newDraws,
          lastDrawDate: newDate
        }
        localStorage.setItem('energyData', JSON.stringify(energyData))//把energyData对象转换为json字符串并存储到本地
      }catch(e){
         console.error('保存能量数据失败：', e)
      }

   },
   {deep:true}
   //,immediate:true
)
//#endregion

//#region  能量球相关

//增加能量
const addEnergy=(amount)=>{
  energyPercent.value=Math.min(energyPercent.value+amount,100)//最多100%
}

const handleDrawCompleted=(isExtraDraw)=>{
  //抽奖一次，清空能量为0
  energyPercent.value=0
   // 如果抽到“再来一次”，不减少抽奖次数；否则减少1次
  if (!isExtraDraw) {
    remainingDraws.value = Math.max(remainingDraws.value - 1, 0)
  }
  // 更新上次抽奖日期（确保当日次数不重置）
  lastDrawDate.value = getToday()

}
//#endregion
//#region 处理图片相关

// 删除图片
const removeImage = (todoIndex, imgIndex) => {
 // 1. 先删除指定图片
  const targetTodo = todos.value[todoIndex]; // 通过索引获取当前待办项
  targetTodo.imageUrls.splice(imgIndex, 1);

  // 2. 检查：文本为空且无图片
  const isTextEmpty = targetTodo.text.trim() === ''; // 使用 targetTodo 访问文本
  const hasNoImages = targetTodo.imageUrls.length === 0; // 使用 targetTodo 访问图片数组

  // 3. 满足条件则删除整个待办项
  if (isTextEmpty && hasNoImages) {
    todos.value.splice(todoIndex, 1);
  }
}

// 修改打开图片查看器的方法，记录索引
const openImageViewer = (url, todoIndex, imgIndex) => {
  currentImageUrl.value = url
  currentTodoIndex.value = todoIndex  // 保存待办索引
  currentImgIndex.value = imgIndex    // 保存图片索引
  showImageViewer.value = true
}

// 新增：处理编辑后的图片更新
const handleUpdateImage = (data) => {
  const { todoIndex, imgIndex, url } = data
  // 更新待办列表中的图片地址
  todos.value[todoIndex].imageUrls[imgIndex] = url
  // 关闭查看器
  showImageViewer.value = false
}

//#endregion

//#region 待办事项
// 添加待办事项
const addTodo = (imageUrls) => {
  // 1. 处理文本：移除首尾空格（无论用户输入什么，先统一处理）
  const trimmedText = newTodo.value.trim();
   // 2. 处理图片（只依赖子组件传递的 imageUrls）
  const safeImageUrls = Array.isArray(imageUrls) ? imageUrls : [];

  // 调试打印：查看实际拿到的文本和图片数量
  console.log('添加时的文本:', trimmedText, '图片数量:', safeImageUrls.length);

  // 3. 判断是否“纯空白且无图片”
  if (trimmedText === '' && safeImageUrls.length === 0) {
    alert('请输入待办内容或添加图片！');
    return;
  }

  todos.value.push({
    text: trimmedText,
    done: false,
    isEditing: false,
    editingText: '',
    dueDate: newTodoDueDate.value|| '',// 避免 undefined
    dueTime: newTodoDueTime.value|| '',// 避免 undefined
    isEditingDate: false,
    editingDueDate: newTodoDueDate.value|| '',
    editingDueTime: newTodoDueTime.value|| '',
    imageUrls: [...safeImageUrls]
  })
   console.log('新增后的数据:', todos.value); // 打印整个数组
  // 清空输入
  newTodo.value = ''
  newTodoDueDate.value = ''
  newTodoDueTime.value = ''
}
// 删除待办事项
const deleteTodo = (index) => {
  todos.value.splice(index, 1)
}
// 切换完成状态（点击复选框时调用，完没完成）,增加：每勾一个完成10%能量
const toggleDone = (index, done) => {
  //直接修改 todos 数组中对应索引的待办项的 done 属性，将其更新为传入的 done 值
  todos.value[index].done = done
  if(done){
    addEnergy(10)//完成一个任务增加10%能量
  }
}
// 编辑待办文本
const editTodo = (index, text) => {
  todos.value[index].text = text
}

// 更新待办日期
const updateTodoDate = (index, dateInfo) => {
  Object.assign(todos.value[index], dateInfo)//assign方法将 dateInfo 对象的属性合并到 todos.value[index] 中
}

//#endregion 

//#region  搜索功能
// 切换搜索框显示
const toggleSearch = () => {
  showSearch.value = !showSearch.value
}

// 处理搜索框失焦
const handleSearchBlur = () => {
   //失焦后，如果搜索框为空就隐藏搜索框
  if (searchKeyword.value.trim() === '') {
    showSearch.value = false
  }
  isSearchFocused.value = false
}

//#endregion  搜索功能

//#region  把筛选后的列表按截止时间排序
// 计算属性
//用computed属性来创建一个新的计算属性filteredTodos，根据搜索关键词筛选待办项
//当搜索关键词改变时，filteredTodos会自动更新（computed属性会根据依赖的变化自动重新计算）
const filteredTodos = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return todos.value//如果搜索关键词为空
  return todos.value.filter(todo => 
    todo.text.toLowerCase().includes(keyword)
  )//只有包含关键词的才能被筛选通过
})

//筛选+排序后的列表
const filteredAndSortedTodos = computed(() => {
  const filtered = filteredTodos.value
  return [...filtered].sort((a, b) => {
    if (sortType.value === 'dueDateTimeAsc') return sortByDateTimeAsc(a, b)
    if (sortType.value === 'dueDateTimeDesc') return sortByDateTimeDesc(a, b)
    return 0
  })
})
// 排序待办
const sortTodos = () => {
  const sorted = [...todos.value]
  if (sortType.value === 'dueDateTimeAsc') {
    sorted.sort(sortByDateTimeAsc)
  } else if (sortType.value === 'dueDateTimeDesc') {
    sorted.sort(sortByDateTimeDesc)
  }
  todos.value = sorted
}

// 排序辅助函数
const sortByDateTimeAsc = (a, b) => {
  // 先比较日期
  if (!a.dueDate && !b.dueDate) return 0
  if (!a.dueDate) return 1
  if (!b.dueDate) return -1

  const dateA = new Date(a.dueDate)
  const dateB = new Date(b.dueDate)
  if (dateA.getTime() !== dateB.getTime()) {
    return dateA - dateB
  }

    // 处理空时间的情况：空时间视为 00:00
  const timeA = a.dueTime || '00:00';
  const timeB = b.dueTime || '00:00';
  return timeA.localeCompare(timeB);
}

const sortByDateTimeDesc = (a, b) => {
  return sortByDateTimeAsc(b, a)
}
//#endregion 

//#region 计算属性（用 computed 函数创建，只读）

//filter根据条件筛选出数组中符合要求的元素，返回一个新数组
const remainingCount = computed(() => {
  return todos.value.filter(todo => !todo.done).length
})

const completedCount = computed(() => {
  return todos.value.filter(todo => todo.done).length
})

const overdueCount = computed(() => {
  return todos.value.filter(todo => isOverdue(todo) && !todo.done).length
})

//#endregion 
</script>

<style scoped>
.todo-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 0 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  box-shadow: 0 8px 15px rgba(0,0,0,0.15);
  background: rgba(156, 207, 167, 0.534);
  position: relative; /* 新增：作为能量球定位的父容器 */

}
/* 能量球定位样式 */
.energy-ball-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10; /* 确保在其他元素上方 */
}

/* 搜索区域样式 */
.search-wrapper {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.search-icon {
  background: none;
  outline: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  margin-right: -33px;
  transition: transform 0.2s;
}

.search-icon:hover {
  transform: scale(1.1);
}

.search-todo {
  flex: 1;
  transition: all 0.3s ease;
}

.search-todo input {
  width: 75%;
  padding: 8px 2px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: border-color 0.2s;
}

.search-todo input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

/* 排序控制样式 */
.sort-controls {
  margin: 10px 0;
  color: #666;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-controls select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  background-color: rgba(161, 222, 149, 0.525);
}

/* 统计信息样式 */
.todo-stats {
  margin-top: 20px;
  color: #666;
  font-size: 14px;
  padding: 10px;
  border-top: 1px solid #eee;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .search-todo input {
    width: 100%;
  }
}
</style>
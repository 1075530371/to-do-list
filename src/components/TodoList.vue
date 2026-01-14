<!--组件只能访问父组件明确传递的 props 属性，不能直接访问父组件的其他变量（包括计算属性）。-->

<template>
   <!-- 待办列表（使用筛选且排序后的列表） -->
     <!--循环渲染todos列表-->
     <!--{类名:条件}，当条件为true的时候添加该类-->
  <ul class="todo-list">

    <!--li标签里面有复选框(判断文本是否完成），文本内容，输入框(双击则是编辑框），截止日期的显示，编辑日期按钮，日期时间编辑框，删除按钮等-->

    <li 
        v-for="(todo, index) in todos" 
      :key="index"
      :class="[
        { completed: todo.done }, 
        { overdue: isOverdue(todo) && !todo.done },
        { soon: isSoonDue(todo) && !todo.done }
      ]"
    >
      <!-- 复选框，标记完成/未完成 -->
       <!--把复选框的 checked 属性与 todo.done 关联（勾选就代表切换状态）,用v-model语法糖实现双向绑定-->
      <input 
        type="checkbox" 
        v-model="todo.done"
        @change="$emit('toggle-done', index, todo.done)"
      >

      <!-- 多图显示区域 -->
      <div class="todo-images" v-if="todo.imageUrls.length">
        <div class="todo-image-item" v-for="(url, imgIndex) in todo.imageUrls" :key="imgIndex">
          <img 
            :src="url" 
            alt="图片" 
            class="preview-img"
            @click="$emit('open-image', url,index,imgIndex)"
          />
          <button @click.stop="$emit('remove-image', index, imgIndex)">×</button>
        </div>
      </div>

      <!-- 待办内容 -->
      <div class="todo-content">
        <!-- 待办内容（正常状态、只读） -->
        <span 
          v-if="!todo.isEditing"
          @dblclick="enterEditMode(todo)"
          v-html="highlightText(todo.text)"
        ></span>

        <!-- 编辑框（编辑状态）,当不再聚焦或者按下Enter键时保存编辑 -->
         <!-- ref用于获取编辑框的 DOM 元素 -->
        <input 
          type="text" 
          v-if="todo.isEditing"
          v-model="todo.editingText"
          @blur="saveEdit(todo, index)"
          @keyup.enter="saveEdit(todo, index)"
          @keyup.esc="cancelEdit(todo)"
          class="edit-input"
        >
       <!--显示截止时间-->
        <span class="due-datetime">
          {{ formatDateTime(todo) ? '截止:' + formatDateTime(todo) : '' }}
        </span>
      </div>

      <!-- 编辑日期按钮 -->
       <!--通过点击阻止冒泡：防止父元素的点击事件触发（eg：判定事物完成而打勾）-->
     <!--只有在不编辑待办文本时才会显示出按钮-->
      <button 
        class="edit-date-btn"
        @click.stop="toggleEditDate(todo)"
        v-if="!todo.isEditing"
      >📅</button>

      <!-- 日期时间编辑框 -->
      <div class="datetime-edit" v-if="todo.isEditingDate">
           <!--日期显示(可编辑)-->
        <input type="date" v-model="todo.editingDueDate">
  
        <input 
          type="time" 
          v-model="todo.editingDueTime"
          step="300"
        >
        <button @click="saveDateTimeEdit(todo, index)" class="save-btn">保存</button>
        <button @click="cancelDateEdit(todo)" class="cancel-btn">取消</button>
      </div>

      <!-- 删除按钮 -->
      <button @click="$emit('delete-todo', index)">删除</button>
    </li>
  </ul>
</template>

<script setup>
import { ref, defineProps, defineEmits, nextTick } from 'vue'
// 导入工具函数
import { isOverdue, isSoonDue, formatDateTime, getNow } from '@/utils/dateUtils'

const props = defineProps({
  todos: Array,
  searchKeyword: String
})

const emit = defineEmits([
  'delete-todo', 
  'toggle-done', 
  'edit-todo', 
  'update-date', 
  'remove-image',
  'open-image'
])

// 进入编辑模式
const enterEditMode = (todo) => {
  todo.isEditing = true//进入编辑模式
  todo.editingText = todo.text//将当前todo项的text属性值赋值给editText属性，用于在编辑框中显示

  //确保在 DOM 更新后再执行聚焦，解决了 “编辑框还没渲染就尝试聚焦” 的问题。
  nextTick(() => {
    const editInputs = document.querySelectorAll('.edit-input')
     // 聚焦当前编辑项的输入框
    editInputs.forEach(input => {
      if (input.parentNode.parentNode.contains(input)) {
        input.focus()
      }
    })
  })
}

// 保存编辑
const saveEdit = (todo, index) => {
  const trimmedText = todo.editingText.trim()//移除编辑框内容前后的空白字符
  const hasNoImages = todo.imageUrls.length === 0; // 检查是否有图片
  if (trimmedText) {
    todo.text = trimmedText
    todo.isEditing = false
    emit('edit-todo', index, trimmedText)
  } else {
    // 文本为空时，判断是否有图片
    if (hasNoImages) {
      // 无文本且无图片：删除待办项
      emit('delete-todo', index);
  }else{
    // 无文本但有图片：保留待办项（只清空文本）
      todo.text = '';
      todo.isEditing = false;
      emit('edit-todo', index, ''); // 通知父组件文本已清空
  }
}
}

// 取消编辑
const cancelEdit = (todo) => {
  todo.isEditing = false
}

// 切换日期编辑模式
const toggleEditDate = (todo) => {
  todo.isEditingDate = !todo.isEditingDate
  if (todo.isEditingDate) {
    todo.editingDueDate = todo.dueDate
    todo.editingDueTime = todo.dueTime
    nextTick(() => {
      const dateInput = document.querySelector('.datetime-edit input[type="date"]')
      if (dateInput) dateInput.focus()
    })
  }
}

// 保存日期编辑
const saveDateTimeEdit = (todo, index) => {
   // 处理默认值：如果只设置了时间没有设置日期，自动补全今天
  if (!todo.editingDueDate && todo.editingDueTime) {
    todo.editingDueDate = getToday()
  }
  // 如果既没有日期也没有时间，提示错误
  if (!todo.editingDueDate && !todo.editingDueTime) {
    alert('请至少设置日期或时间')
    return
  }
  // 如果有日期但没有时间，自动补全00:00
  if (todo.editingDueDate && !todo.editingDueTime) {
    todo.editingDueTime = '00:00'
  }
  const dateInfo = {
    dueDate: todo.editingDueDate,
    dueTime: todo.editingDueTime,
    isEditingDate: false
  }
  emit('update-date', index, dateInfo)
}

// 取消日期编辑
const cancelDateEdit = (todo) => {
  todo.isEditingDate = false
}

// 高亮搜索关键词
const highlightText = (text) => {
  const keyword = props.searchKeyword.trim()
  if (!keyword) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}
</script>

<style scoped>
.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  margin: 5px 0;
  border: 1px solid #eee;
  border-radius: 4px;
  flex-wrap: wrap;
}

/* 图片相关样式 */
.todo-images {
  display: flex;
  gap: 8px;
  margin: 0 10px;
  align-items: center;
}

.todo-image-item {
  position: relative;
  width: 60px;
  height: 60px;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid red;
  cursor: zoom-in;
  transition: transform 0.2s;
}

.preview-img:hover {
  transform: scale(1.05);
}

.todo-image-item button {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff4444;
  color: white;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
}

/* 待办内容样式 */
.todo-content {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
}

.due-datetime {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.todo-list li.has-time .due-datetime {
  color: #333;
  font-weight: 500;
}

/* 编辑框样式 */
.edit-input {
  flex: 1;
  padding: 5px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

/* 编辑日期按钮 */
.edit-date-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
  outline: none;
  transition: transform 0.2s;
}

.edit-date-btn:hover {
  transform: scale(1.1);
}

/* 日期编辑框 */
.datetime-edit {
  display: flex;
  gap: 8px;
  margin: 5px 0;
  padding: 5px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  width: 100%;
  flex-wrap: wrap;
}

.datetime-edit input {
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.datetime-edit button {
  padding: 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
}

.datetime-edit .cancel-btn {
  background: #474646;
  color: white;
  margin-left: 5px;
}

.datetime-edit .save-btn {
  background: #42b983;
  color: white;
}

/* 完成状态样式 */
.todo-list li.completed span {
  text-decoration: line-through;
  color: #999;
}

/* 逾期样式 */
.todo-list li.overdue {
  border-left: 4px solid #ff4444;
  background-color: #fff8f8;
}

.todo-list li.overdue .due-datetime {
  color: #f16f6f;
  font-weight: bold;
}

/* 即将到期样式 */
.todo-list li.soon {
  border-left: 4px solid #ffdd44;
  background-color: #fffef5;
}

.todo-list li.soon .due-datetime {
  color: #e6a500;
}

/* 删除按钮 */
.todo-list button:not(.save-btn):not(.cancel-btn):not(.edit-date-btn) {
  margin-left: auto;
  padding: 4px;
  background: #f16f6f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
}

/* 高亮样式 */
:deep(.highlight) {
  background: #ffff00;
  color: black;
  font-weight: bold;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
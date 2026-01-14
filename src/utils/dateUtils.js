// src/utils/dateUtils.js

/* 获取当前日期（YYYY-MM-DD格式） */
export const getToday = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/* 获取当前时间（HH:MM格式） */
export const getCurrentTime = () => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

/* 获取当前时间对象（精确到分钟）*/
export const getNow = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())
}

/**
 * 判断待办项是否过期
 * @param {Object} todo - 待办项对象
 * @returns {boolean} 是否过期
 */
export const isOverdue = (todo) => {
  // 都没有设置，不判断过期
  if (!todo.dueDate && !todo.dueTime) return false

  // 处理日期：未设置日期则默认今天
  const dueDate = todo.dueDate || getToday()
  // 处理时间：未设置时间则默认00:00
  const dueTime = todo.dueTime || '00:00'

  const [year, month, day] = dueDate.split('-').map(Number)
  const [hours, minutes] = dueTime.split(':').map(Number)
  
  const due = new Date(year, month - 1, day, hours, minutes)
  return due < getNow()
}

/**
 * 判断待办项是否即将到期（1小时内）
 * @param {Object} todo - 待办项对象
 * @returns {boolean} 是否即将到期
 */
export const isSoonDue = (todo) => {
  // 都没有设置，不判断
  if (!todo.dueDate && !todo.dueTime) return false

  // 处理日期和时间默认值
  const dueDate = todo.dueDate || getToday()
  const dueTime = todo.dueTime || '00:00'

  const [year, month, day] = dueDate.split('-').map(Number)
  const [hours, minutes] = dueTime.split(':').map(Number)
  
  const due = new Date(year, month - 1, day, hours, minutes)
  const now = getNow()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000) // 1小时后

  return due >= now && due <= oneHourLater
};

/**
 * 格式化日期时间显示（精确到分）
 * @param {Object} todo - 待办项对象
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatDateTime = (todo) => {
  // 都没有设置，返回空
  if (!todo.dueDate && !todo.dueTime) return ''

  // 处理默认值
  const dueDate = todo.dueDate || getToday()
  const dueTime = todo.dueTime || '00:00'

  const [year, month, day] = dueDate.split('-').map(Number)
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  
  return `${dateStr} ${dueTime}`
};
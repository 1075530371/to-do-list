<script setup>
import toDoList from './components/TodoApp.vue'
//console.log('导入的组件：', toDoList)
</script>

<template>
  <div id="app">
    <toDoList />
  </div>

</template>

<style>
.body{
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
}
</style>

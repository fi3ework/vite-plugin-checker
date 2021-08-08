<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" />
  </div>
</template>

<script lang="ts">
import Vuex from 'vuex'
import Vue from 'vue'
// import { IProps } from '../store/index'

Vue.use(Vuex)

export default {
  computed: {
    supply() {
      return this.$store.state.count
    },
  },
}
</script>

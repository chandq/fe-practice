<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <ul>
      <li :key="index" v-for="(index, item) in arr">{{ item }}</li>
    </ul>
    <div v-bind:style="{ color: activeColor, fontSize: fontSize + 'px' }">TEST STYLE</div>
    <div v-show="activeColor === 'yellow'">v-show demo</div>
    <div v-if="activeColor === 'yellow'">v-if demo</div>
    <input type="text" v-model="textVal" />

    <div @mouseenter="mouseenter" @mousemove="mousemove" @mouseleave="mouseleave">event trigger</div>
    前端
    <HelloWorld2 @textChange="onTextChange" msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue';

export default {
  name: 'app-demo',
  data() {
    return { arr: [1, 2, 3, 4], text: 'yy', activeColor: 'red', fontSize: 12, textVal: 'text demo' };
  },
  components: {
    // HelloWorld
  },
  mounted() {
    setTimeout(() => {
      this.text = 'new-yy';
      this.activeColor = 'green';
      this.fontSize = 24;
    }, 1000);
  },
  watch: {
    text: function (newV) {
      console.log('newV', newV);
    },
    textVal: function (newV) {
      console.log('textVal', newV);
    }
  },
  methods: {
    onTextChange(data) {
      console.log('textChange', data);
    },
    mouseenter(event) {
      console.log('mouseenter', event.clientX);
      this.activeColor = 'yellow';
    },
    mousemove(event) {
      console.log('mousemove', event.clientX);
    },
    mouseleave(event) {
      console.log('mouseleave', event.clientX);
      this.activeColor = 'green';
    }
  }
};
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

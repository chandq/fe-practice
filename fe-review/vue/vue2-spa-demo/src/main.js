import Vue from 'vue';
// import App1 from './App.vue';
import HelloWorld from './components/HelloWorld.vue';

Vue.config.productionTip = false;
Vue.component('HelloWorld2', HelloWorld);

// new Vue({
//   // components: { HelloWorld },
//   render: h => h(App1)
// }).$mount('#app');

Vue.component('ChildComponent', {
  template: '<div @click="go">Child</div>',
  methods: {
    go() {
      location.href = 'https://baidu.com';
    }
  },
  beforeCreate() {
    console.log('Child beforeCreate');
  },
  created() {
    console.log('Child created');
  },
  beforeMount() {
    console.log('Child beforeMount');
  },
  mounted() {
    console.log('Child mounted');
  }
});

setTimeout(() => {
  new Vue({
    el: '#app',
    template: '<div><ChildComponent /></div>',
    beforeCreate() {
      console.log('Parent beforeCreate');
    },
    created() {
      console.log('Parent created');
    },
    beforeMount() {
      console.log('Parent beforeMount');
    },
    mounted() {
      console.log('Parent mounted');
    }
  });
});

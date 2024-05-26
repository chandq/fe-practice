import Vue from 'vue';
import App1 from './App.vue';
import HelloWorld from './components/HelloWorld.vue';

Vue.config.productionTip = false;
Vue.component('HelloWorld2', HelloWorld);

new Vue({
  // components: { HelloWorld },
  render: h => h(App1)
}).$mount('#app');

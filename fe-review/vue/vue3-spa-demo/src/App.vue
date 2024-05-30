<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'

const router = useRouter()
const reqTest = ref('')
function handleJump() {
  // router.push({ name: 'about' })
  router.push({ path: '/about', query: { from: 'home', b: 2 }, params: { aa: '1' } })
}
async function handleRequest() {
  fetch('http://127.0.0.1:8090/mock/service/aa').then(async (res) => {
    reqTest.value = await res.json()
  })
  // const res = await (await fetch('http://127.0.0.1:8090/mock/service/aa')).json()

  console.log('res', reqTest.value)
}
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/xmind">XMind</RouterLink>
        <RouterLink to="/xmind2">XMind2</RouterLink>
        <a href="//baidu.com" target="_blank" style="color: red">跳转百度</a>
        <a javascript="void 0" style="color: red" @click="handleJump">js跳转</a>
        <a javascript="void 0" style="color: red" @click="handleRequest">发送ajax请求</a>
        {{ `${JSON.stringify(reqTest, null, 4)}` }}
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>

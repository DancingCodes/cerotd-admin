<template>
  <UApp>
    <NuxtLayout>
    
      <NuxtPage />
    </NuxtLayout>
    <UToaster />
  </UApp>
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'zh-CN'
  }
})
</script>

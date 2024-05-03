<script lang="ts" setup>
import { randamText } from './utils';

definePage(() => {
  return {
    style: {
      navigationBarTitleText: randamText(),
    },
    tabbar: {},
  };
});
</script>

<template>
  <div>test</div>
</template>

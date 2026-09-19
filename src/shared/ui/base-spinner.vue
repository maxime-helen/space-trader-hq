<template>
  <span class="base-spinner"></span>
</template>

<style scoped>
.base-spinner {
  width: 0.9em;
  height: 0.9em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
  opacity: 0.85;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

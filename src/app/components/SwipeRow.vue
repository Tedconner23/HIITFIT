<script setup>
import { ref } from 'vue'

// Swipe the row left to reveal a Delete action. Pointer events cover touch and
// mouse; no library needed.
const emit = defineEmits(['delete'])

const REVEAL = 96 // px, matches the Delete button width (w-24)
const offset = ref(0)
const dragging = ref(false)

let startX = 0
let startOffset = 0
let moved = false
let wasOpen = false

function onDown(e) {
  dragging.value = true
  moved = false
  wasOpen = offset.value !== 0
  startX = e.clientX
  startOffset = offset.value
  // NB: do NOT capture the pointer here. Capturing on pointerdown makes the
  // browser dispatch the resulting `click` on this wrapper instead of the
  // <a> link inside the slot, which silently breaks row navigation. We only
  // capture once an actual drag begins (see onMove).
}

function onMove(e) {
  if (!dragging.value) return
  const dx = e.clientX - startX
  if (Math.abs(dx) > 6 && !moved) {
    moved = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  if (moved) offset.value = Math.min(0, Math.max(-REVEAL, startOffset + dx))
}

function onUp() {
  if (!dragging.value) return
  dragging.value = false
  offset.value = offset.value < -REVEAL / 2 ? -REVEAL : 0
}

// Swallow the click that ends a drag, or a tap on an already-open row (which
// just closes it), so it doesn't also trigger the row's navigation.
function onClickCapture(e) {
  if (moved || wasOpen) {
    e.preventDefault()
    e.stopPropagation()
  }
  if (wasOpen && !moved) offset.value = 0
  moved = false
}
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl">
    <button
      class="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-red-600 text-sm font-medium text-white"
      @click="emit('delete')"
    >
      Delete
    </button>
    <div
      class="relative touch-pan-y"
      :style="{
        transform: `translateX(${offset}px)`,
        transition: dragging ? 'none' : 'transform 150ms',
      }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @click.capture="onClickCapture"
    >
      <slot />
    </div>
  </div>
</template>

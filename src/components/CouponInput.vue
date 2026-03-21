<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  useManual: boolean
  isProcessing: boolean
  cooldownCounter: number
  canRedeem: boolean
  codesCount: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:useManual', value: boolean): void
  (e: 'redeem'): void
}>()

const couponInput = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const useManualCodes = computed({
  get: () => props.useManual,
  set: (val) => emit('update:useManual', val)
})
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h2 class="card-title flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-primary">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
          2. รหัสคูปอง
        </h2>
        <div class="form-control">
          <label class="label cursor-pointer gap-3 bg-base-200 px-4 py-1 rounded-full">
            <span class="label-text font-bold text-xs uppercase tracking-widest">กรอกโค้ดเอง</span> 
            <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="useManualCodes" :disabled="isProcessing" />
          </label>
        </div>
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text opacity-70">ใส่รหัสคูปอง (1 รหัสต่อ 1 บรรทัด)</span>
        </label>
        <textarea 
          class="textarea textarea-bordered h-48 font-mono text-sm focus:textarea-primary transition-all" 
          placeholder="ใส่โค้ด 1&#10;ใส่โค้ด 2&#10;ใส่โค้ด 3"
          v-model="couponInput"
          :disabled="isProcessing || !useManualCodes"
        ></textarea>
      </div>
      
      <div class="flex flex-col items-center justify-center mt-6 gap-4">
        <button 
          class="btn btn-primary btn-lg w-full md:btn-wide shadow-lg hover:shadow-primary/20 transition-all gap-3" 
          @click="$emit('redeem')"
          :disabled="isProcessing || !canRedeem || cooldownCounter > 0"
        >
          <span v-if="isProcessing" class="loading loading-spinner"></span>
          <svg v-else-if="cooldownCounter > 0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 animate-pulse">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699-2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
          </svg>

          <span class="font-bold tracking-wide">
            <template v-if="isProcessing">กำลังเติม...</template>
            <template v-else-if="cooldownCounter > 0">รออีก {{ cooldownCounter }} วินาที</template>
            <template v-else>
              {{ codesCount > 1 ? `เติมรหัสทั้งหมด (${codesCount})` : 'เติมรหัสนี้เลย' }}
            </template>
          </span>
        </button>
        <p v-if="!canRedeem" class="text-xs text-error font-medium animate-pulse">กรุณาเลือกหรือใส่ UID ก่อนจ้า</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.textarea {
  resize: none;
}
</style>
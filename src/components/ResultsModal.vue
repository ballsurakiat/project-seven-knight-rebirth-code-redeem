<script setup lang="ts">
import { computed } from 'vue'

interface Result {
  code: string
  status: 'pending' | 'loading' | 'success' | 'error'
  message?: string
}

const props = defineProps<{
  show: boolean
  results: Result[]
  isProcessing: boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'stop'): void
}>()

const progress = computed(() => {
  if (props.results.length === 0) return 0
  const completed = props.results.filter(r => r.status !== 'pending' && r.status !== 'loading').length
  return Math.round((completed / props.results.length) * 100)
})
</script>

<template>
  <div class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box max-w-4xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg">3. ผลการเติมโค้ด</h3>
        <div class="badge badge-lg" :class="progress === 100 ? 'badge-success' : 'badge-primary'">
          สำเร็จไปแล้ว {{ progress }}%
        </div>
      </div>
      
      <progress 
        class="progress w-full mb-4" 
        :value="progress" 
        max="100"
        :class="progress === 100 ? 'progress-success' : 'progress-primary'"
      ></progress>

      <div class="overflow-x-auto max-h-[60vh] overflow-y-auto border border-base-200 rounded-lg">
        <table class="table table-zebra w-full table-pin-rows">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>สถานะ</th>
              <th>ข้อความจากเซิร์ฟเวอร์</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in results" :key="item.code">
              <td class="font-mono">{{ item.code }}</td>
              <td>
                <div v-if="item.status === 'pending'" class="badge badge-ghost">รอคิว</div>
                <div v-else-if="item.status === 'loading'" class="flex items-center gap-2">
                  <span class="loading loading-spinner loading-xs text-info"></span>
                  <span class="text-info">กำลังทำรายการ</span>
                </div>
                <div v-else-if="item.status === 'success'" class="badge badge-success">เย้! สำเร็จ</div>
                <div v-else-if="item.status === 'error'" class="badge badge-error">ว้าย! พลาด</div>
              </td>
              <td class="text-sm">
                {{ item.message || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-action">
        <button 
          v-if="isProcessing" 
          class="btn btn-error btn-outline" 
          @click="$emit('stop')"
        >
          หยุดประมวลผล
        </button>
        <button 
          v-else 
          class="btn" 
          @click="$emit('close')"
        >
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  </div>
</template>
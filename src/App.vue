<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUIDs } from './composables/useUIDs'
import { useRedeemer } from './composables/useRedeemer'
import { defaultCodes } from './data/defaultCodes'

const { uids, selectedUID, addUID, removeUID, selectUID } = useUIDs()
const { results, isProcessing, redeemCodes } = useRedeemer()

const newUIDInput = ref('')
const couponInput = ref('')
const useDefaultCodes = ref(false)

// Watch useDefaultCodes to update the textarea for visual feedback
watch(useDefaultCodes, (newValue) => {
  if (newValue) {
    couponInput.value = defaultCodes.join('\n')
  } else {
    couponInput.value = ''
  }
}, { immediate: false })

const handleAddUID = () => {
  if (newUIDInput.value.trim()) {
    addUID(newUIDInput.value.trim())
    newUIDInput.value = ''
  }
}

const handleRedeem = () => {
  if (!selectedUID.value) {
    alert('กรุณาเลือกหรือใส่ UID ก่อนนะจ๊ะ')
    return
  }
  
  const codes = (useDefaultCodes.value ? defaultCodes : couponInput.value
    .split('\n'))
    .map(c => c.trim())
    .filter(c => c.length > 0)
    
  if (codes.length === 0) {
    alert('กรุณาใส่รหัสคูปองอย่างน้อย 1 รหัสจ้า')
    return
  }
  
  redeemCodes(selectedUID.value, codes)
}

const progress = computed(() => {
  if (results.value.length === 0) return 0
  const completed = results.value.filter(r => r.status !== 'pending' && r.status !== 'loading').length
  return Math.round((completed / results.value.length) * 100)
})
</script>

<template>
  <div class="min-h-screen bg-base-200 p-4 md:p-8">
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-4xl font-bold text-primary">เซเว่นไนท์: เกิดใหม่กี่โมง?</h1>
        <p class="text-xl opacity-70 mt-2">ระบบช่วยกรอกโค้ดแบบรัวๆ ไม่ต้องพัก</p>
      </div>

      <!-- UID Management -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">1. จัดการ UID</h2>
          <div class="flex flex-col md:flex-row gap-4">
            <!-- Select Cached UID -->
            <div class="form-control flex-1">
              <label class="label">
                <span class="label-text">เลือก UID ที่บันทึกไว้</span>
              </label>
              <select 
                class="select select-bordered w-full" 
                v-model="selectedUID"
                @change="selectUID(selectedUID)"
              >
                <option value="" disabled selected>เลือก UID ของคุณ</option>
                <option v-for="uid in uids" :key="uid" :value="uid">{{ uid }}</option>
              </select>
            </div>
            
            <!-- Add New UID -->
            <div class="form-control flex-1">
              <label class="label">
                <span class="label-text">เพิ่ม UID ใหม่</span>
              </label>
              <div class="join">
                <input 
                  type="text" 
                  placeholder="ใส่ UID ตรงนี้" 
                  class="input input-bordered w-full join-item" 
                  v-model="newUIDInput"
                  @keyup.enter="handleAddUID"
                />
                <button class="btn btn-primary join-item" @click="handleAddUID">เพิ่ม</button>
              </div>
            </div>
          </div>
          
          <!-- Selected UID Indicator & Removal -->
          <div v-if="selectedUID" class="mt-4 flex items-center justify-between bg-base-200 p-3 rounded-lg">
            <div>
              UID ที่ใช้อยู่: <span class="font-bold text-secondary">{{ selectedUID }}</span>
            </div>
            <button class="btn btn-ghost btn-xs text-error" @click="removeUID(selectedUID)">ลบทิ้งซะ</button>
          </div>
        </div>
      </div>

      <!-- Coupon Codes Input -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h2 class="card-title">2. รหัสคูปอง</h2>
            <div class="form-control">
              <label class="label cursor-pointer gap-2">
                <span class="label-text font-semibold">โค้ดล่าสุดเท่าที่หาได้ (อัปเดตเองนักเลงพอ)</span> 
                <input type="checkbox" class="toggle toggle-primary" v-model="useDefaultCodes" :disabled="isProcessing" />
              </label>
            </div>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">ใส่รหัสคูปอง (1 รหัสต่อ 1 บรรทัด)</span>
            </label>
            <textarea 
              class="textarea textarea-bordered h-48 font-mono" 
              placeholder="ใส่โค้ด 1&#10;ใส่โค้ด 2&#10;ใส่โค้ด 3"
              v-model="couponInput"
              :disabled="isProcessing || useDefaultCodes"
            ></textarea>
          </div>
          
          <div class="card-actions justify-end mt-4">
            <button 
              class="btn btn-primary btn-lg w-full md:w-auto" 
              @click="handleRedeem"
              :disabled="isProcessing || !selectedUID"
            >
              <span v-if="isProcessing" class="loading loading-spinner"></span>
              {{ isProcessing ? 'กำลังเติม... รอก่อนนะวัยรุ่น' : 'เติมให้หมดนี่เลย!' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div v-if="results.length > 0" class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex items-center justify-between mb-2">
            <h2 class="card-title">3. ผลการเติมโค้ด</h2>
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

          <div class="overflow-x-auto max-h-96 overflow-y-auto border border-base-200 rounded-lg">
            <table class="table table-zebra w-full">
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
                  <td class="text-sm max-w-xs truncate" :title="item.message">
                    {{ item.message || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.textarea {
  resize: none;
}
</style>

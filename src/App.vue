<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUIDs } from './composables/useUIDs'
import { useRedeemer } from './composables/useRedeemer'
import { defaultCodes } from './data/defaultCodes'

const { uids, selectedUID, addUID, removeUID, selectUID } = useUIDs()
const { results, isProcessing, redeemCodes, stopRedeeming } = useRedeemer()

const newUIDInput = ref('')
const newNameInput = ref('')
const couponInput = ref(defaultCodes.join('\n'))
const useManualCodes = ref(true)
const useCORSProxy = ref(true) // Default to true for better user experience in production
const cooldownCounter = ref(0)
const showResultsModal = ref(false)
let cooldownTimer: any = null

const startCooldown = () => {
  cooldownCounter.value = 10
  cooldownTimer = setInterval(() => {
    cooldownCounter.value--
    if (cooldownCounter.value <= 0) {
      clearInterval(cooldownTimer)
    }
  }, 1000)
}

// Watch useManualCodes to update the textarea for visual feedback
watch(useManualCodes, (newValue) => {
  if (!newValue) {
    couponInput.value = defaultCodes.join('\n')
  } else {
    couponInput.value = ''
  }
}, { immediate: false })

const handleAddUID = () => {
  if (newUIDInput.value.trim()) {
    addUID(newUIDInput.value.trim(), newNameInput.value.trim())
    newUIDInput.value = ''
    newNameInput.value = ''
  }
}

const handleRedeem = async () => {
  if (!selectedUID.value) {
    alert('กรุณาเลือกหรือใส่ UID ก่อนนะจ๊ะ')
    return
  }
  
  const codes = (useManualCodes.value ? couponInput.value.split('\n') : defaultCodes)
    .map(c => c.trim())
    .filter(c => c.length > 0)
    
  if (codes.length === 0) {
    alert('กรุณาใส่รหัสคูปองอย่างน้อย 1 รหัสจ้า')
    return
  }
  
  showResultsModal.value = true
  await redeemCodes(selectedUID.value, codes, useCORSProxy.value)
  startCooldown()
}

const progress = computed(() => {
  if (results.value.length === 0) return 0
  const completed = results.value.filter(r => r.status !== 'pending' && r.status !== 'loading').length
  return Math.round((completed / results.value.length) * 100)
})

const currentCodes = computed(() => {
  return (useManualCodes.value ? couponInput.value.split('\n') : defaultCodes)
    .map(c => c.trim())
    .filter(c => c.length > 0)
})

const isOverLimit = computed(() => currentCodes.value.length > 50)
</script>

<template>
  <div class="min-h-screen bg-base-200 p-4 md:p-8">
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-4xl font-bold text-primary">7+1 อัศวิน: เกิดใหม่กี่โมง?</h1>
        <p class="text-xl opacity-70 mt-2">ระบบช่วยแลกโค้ดแบบรัวๆ</p>
      </div>

      <!-- Warning/Disclaimer - Only show when over limit -->
      <div v-if="isOverLimit" class="alert alert-error shadow-lg animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <div>
          <h3 class="font-bold">ใจเย็นๆ นะวัยรุ่น! เยอะเกินไปแล้ว</h3>
          <div class="text-xs">ใส่รหัสมา {{ currentCodes.length }} รหัส ระบบจะเติมให้แค่ 50 รหัสแรกเท่านั้นนะจ๊ะ เพื่อป้องกันการถูกแบนและถนอมเซิร์ฟเวอร์</div>
        </div>
      </div>

      <!-- UID Management -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">1. จัดการ UID</h2>
          <div class="space-y-4">
            <!-- Select Cached UID -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">เลือก UID ที่บันทึกไว้</span>
              </label>
              <select 
                class="select select-bordered w-full" 
                v-model="selectedUID"
                @change="selectUID(selectedUID)"
              >
                <option value="" disabled selected>เลือก UID ของคุณ</option>
                <option v-for="uid in uids" :key="uid.id" :value="uid.id">
                  {{ uid.name ? `${uid.name} (${uid.id})` : uid.id }}
                </option>
              </select>
            </div>
            
            <div class="divider">หรือ</div>

            <!-- Add New UID -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">ใส่ UID</span>
                </label>
                <input 
                  type="text" 
                  placeholder="เช่น ABC12345" 
                  class="input input-bordered w-full" 
                  v-model="newUIDInput"
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">ตั้งชื่อ (Optional)</span>
                </label>
                <div class="join">
                  <input 
                    type="text" 
                    placeholder="เช่น ไอดีหลัก" 
                    class="input input-bordered w-full join-item" 
                    v-model="newNameInput"
                    @keyup.enter="handleAddUID"
                  />
                  <button class="btn btn-primary join-item" @click="handleAddUID">เพิ่ม</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Selected UID Indicator & Removal -->
          <div v-if="selectedUID" class="mt-4 flex items-center justify-between bg-base-200 p-3 rounded-lg border border-base-300">
            <div>
              <span class="text-xs opacity-50 block uppercase font-bold">กำลังใช้งาน</span>
              <span class="font-bold text-secondary text-lg">
                {{ uids.find(u => u.id === selectedUID)?.name || '' }}
              </span>
              <span class="text-sm ml-1 opacity-70">({{ selectedUID }})</span>
            </div>
            <button class="btn btn-ghost btn-xs text-error hover:bg-error/10" @click="removeUID(selectedUID)">ลบทิ้ง</button>
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
                <span class="label-text font-semibold">กรอกโค้ดเอง</span> 
                <input type="checkbox" class="toggle toggle-primary" v-model="useManualCodes" :disabled="isProcessing" />
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
              :disabled="isProcessing || !useManualCodes"
            ></textarea>
          </div>
          
          <div class="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
            <div class="form-control">
              <label class="label cursor-pointer gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-secondary" v-model="useCORSProxy" :disabled="isProcessing" />
                <span class="label-text-alt">เปิดใช้งาน Proxy (กรณีเติมไม่เข้า/ติด CORS)</span> 
              </label>
            </div>
            <button 
              class="btn btn-primary btn-lg w-full md:w-auto" 
              @click="handleRedeem"
              :disabled="isProcessing || !selectedUID || cooldownCounter > 0"
            >
              <span v-if="isProcessing" class="loading loading-spinner"></span>
              <template v-if="isProcessing">กำลังเติม... รอก่อนนะวัยรุ่น</template>
              <template v-else-if="cooldownCounter > 0">รออีก {{ cooldownCounter }} วินาทีนะจ๊ะ</template>
              <template v-else>เติมให้หมดนี่เลย!</template>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <footer class="max-w-3xl mx-auto mt-8 mb-8 text-center text-sm opacity-50 px-4">
      <p>พัฒนาขึ้นเพื่อความสะดวกของชาวอัศวิน โดย <a href="https://github.com/ballsurakiat/project-seven-knight-rebirth-code-redeem" target="_blank" class="link link-hover font-bold">ballsurakiat</a></p>
      <p class="mt-1">ห้ามนำไปใช้ในเชิงพาณิชย์โดยเด็ดขาด</p>
    </footer>

    <!-- Results Modal -->
    <div class="modal" :class="{ 'modal-open': showResultsModal }">
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
            @click="stopRedeeming"
          >
            หยุดประมวลผล
          </button>
          <button 
            v-else 
            class="btn" 
            @click="showResultsModal = false"
          >
            ปิดหน้าต่าง
          </button>
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

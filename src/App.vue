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
const useManualCodes = ref(false)
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
  await redeemCodes(selectedUID.value, codes)
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
          <h2 class="card-title flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-primary">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            1. จัดการ UID
          </h2>
          <div class="space-y-4">
            <!-- Select Cached UID (Only if exists) -->
            <template v-if="uids.length > 0">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">เลือก UID ที่บันทึกไว้</span>
                  <span class="label-text-alt opacity-50 italic">* บันทึกในเบราว์เซอร์ของคุณเท่านั้น</span>
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
              
              <div class="divider">หรือเพิ่มใหม่</div>
            </template>

            <!-- Add New UID -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">ใส่ UID ใหม่</span>
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
                  <span class="label-text font-semibold">ตั้งชื่อเล่น (Optional)</span>
                </label>
                <div class="join w-full">
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
          <div v-if="selectedUID" class="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/10 gap-4">
            <div class="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
              <div class="avatar placeholder shrink-0">
                <div class="bg-primary text-primary-content rounded-full w-10">
                  <span class="text-xs">{{ (uids.find(u => u.id === selectedUID)?.name || 'U').charAt(0).toUpperCase() }}</span>
                </div>
              </div>
              <div class="overflow-hidden">
                <span class="text-[10px] opacity-60 block uppercase font-bold tracking-wider">กำลังใช้งาน</span>
                <div class="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 overflow-hidden">
                  <span class="font-bold text-lg leading-tight truncate">
                    {{ uids.find(u => u.id === selectedUID)?.name || 'ไม่ระบุชื่อ' }}
                  </span>
                  <span class="text-xs opacity-50 font-mono truncate">({{ selectedUID }})</span>
                </div>
              </div>
            </div>
            <button class="btn btn-error btn-outline btn-sm sm:btn-ghost sm:btn-circle sm:text-error hover:bg-error/10 w-full sm:w-auto gap-2" @click="removeUID(selectedUID)">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <span class="sm:hidden">ลบ UID นี้</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Coupon Codes Input -->
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
              @click="handleRedeem"
              :disabled="isProcessing || !selectedUID || cooldownCounter > 0"
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
                  {{ currentCodes.length > 1 ? `เติมรหัสทั้งหมด (${currentCodes.length})` : 'เติมรหัสนี้เลย' }}
                </template>
              </span>
            </button>
            <p v-if="!selectedUID" class="text-xs text-error font-medium animate-pulse">กรุณาเลือกหรือใส่ UID ก่อนจ้า</p>
          </div>
        </div>
      </div>

      <!-- Ads / Sponsored Section -->
      <div class="card bg-base-100 shadow-xl border border-primary/10 overflow-hidden group">
        <div class="bg-primary/5 px-4 py-2 flex items-center justify-between border-b border-primary/10">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Sponsored by Guild 3เดือนเลิก</span>
          </div>
          <span class="text-[10px] font-medium opacity-40 italic">สนับสนุนเซิร์ฟเวอร์</span>
        </div>
        <div class="card-body p-0">
          <img 
            src="/ads.jpg" 
            alt="กิลด์ 3เดือนเลิก รับสมัครสมาชิก" 
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
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

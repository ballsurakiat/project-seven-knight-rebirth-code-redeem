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
const showAddInput = ref(false)
const saveUIDCheckbox = ref(false)
const lastSelectedBeforeAdd = ref('')
let cooldownTimer: any = null

// Watch showAddInput to handle selection recovery
watch(showAddInput, (isShowing) => {
  if (isShowing) {
    // Store current selection before opening form
    lastSelectedBeforeAdd.value = selectedUID.value
    // Clear selection so list items don't look active while typing new one
    selectedUID.value = ''
  } else {
    // Recover previous selection or default to last in list if cancelled
    if (!selectedUID.value && uids.value.length > 0) {
      selectedUID.value = lastSelectedBeforeAdd.value || uids.value[uids.value.length - 1].id
    }
  }
})

// Watch uids to ensure showAddInput is true if empty
watch(uids, (newVal) => {
  if (newVal.length === 0) {
    showAddInput.value = true
    saveUIDCheckbox.value = false
  }
}, { immediate: true })

// Sync manual input to selectedUID when not in 'save' mode
watch([newUIDInput, saveUIDCheckbox, showAddInput], ([newVal, isSave, isShowing]) => {
  if (isShowing && !isSave) {
    selectedUID.value = newVal.trim()
  }
})

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
  const cleanID = newUIDInput.value.trim()
  if (cleanID && saveUIDCheckbox.value) {
    addUID(cleanID, newNameInput.value.trim())
    newUIDInput.value = ''
    newNameInput.value = ''
    showAddInput.value = false
  }
}

const handleRedeem = async () => {
  // Use manual input if form is showing, otherwise use selected from list
  const uidToUse = showAddInput.value ? newUIDInput.value.trim() : selectedUID.value
  
  if (!uidToUse) {
    alert('กรุณาเลือกหรือระบุ UID ก่อนนะจ๊ะ')
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
  await redeemCodes(uidToUse, codes)
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
          <h2 class="card-title flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-primary">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              1. บัญชีของคุณ
            </div>
            <button 
              v-if="uids.length > 0"
              class="btn btn-ghost btn-sm text-primary gap-1"
              @click="showAddInput = !showAddInput"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path v-if="!showAddInput" stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {{ showAddInput ? 'ปิด' : 'เพิ่มไอดีใหม่' }}
            </button>
          </h2>

          <div class="space-y-4">
            <!-- Profile Switcher (Large Items) -->
            <div v-if="uids.length > 0 && !showAddInput" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                v-for="uid in uids" 
                :key="uid.id"
                @click="selectUID(uid.id)"
                class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer relative group"
                :class="selectedUID === uid.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-base-200 border-transparent hover:border-base-300'"
              >
                <!-- Delete Button on Left -->
                <button 
                  class="btn btn-circle btn-xs btn-ghost text-error hover:bg-error/20 shrink-0"
                  @click.stop="removeUID(uid.id)"
                  title="ลบไอดีนี้"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div class="flex flex-col items-start leading-tight flex-1 overflow-hidden">
                  <span class="text-base font-bold truncate w-full" :class="selectedUID === uid.id ? 'text-primary' : ''">
                    {{ uid.name || 'ไม่มีชื่อเรียก' }}
                  </span>
                  <span class="text-xs opacity-50 font-mono truncate w-full">{{ uid.id }}</span>
                </div>

                <!-- Selection Icon -->
                <div v-if="selectedUID === uid.id" class="text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="!showAddInput" class="text-center py-10 bg-base-200/30 rounded-2xl border-2 border-dashed border-base-300">
              <p class="text-base opacity-50">ยังไม่มีไอดีที่บันทึกไว้</p>
              <button class="btn btn-primary btn-sm mt-3" @click="showAddInput = true">เพิ่มไอดีแรกของคุณ</button>
            </div>

            <!-- Add New UID Form -->
            <div v-if="showAddInput" class="p-5 bg-primary/5 rounded-2xl border border-primary/20 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div class="space-y-4">
                <div class="form-control">
                  <label class="label pt-0">
                    <span class="label-text font-bold text-sm text-primary uppercase tracking-wider">ระบุ UID ของคุณ</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="เช่น ABC12345" 
                    class="input input-bordered w-full input-lg shadow-inner" 
                    v-model="newUIDInput"
                  />
                  <label class="label">
                    <span class="label-text-alt opacity-60">คุณสามารถดู UID ได้ในหน้าตั้งค่าภายในเกม</span>
                  </label>
                </div>

                <!-- Only show checkbox if no UIDs exist (First time user) -->
                <div v-if="uids.length === 0" class="form-control">
                  <label class="label cursor-pointer justify-start gap-3">
                    <input type="checkbox" class="checkbox checkbox-primary" v-model="saveUIDCheckbox" />
                    <span class="label-text font-bold">บันทึกไอดีนี้ไว้ใช้ครั้งหน้า</span>
                  </label>
                </div>

                <!-- Show name input if checkbox is checked OR if adding from list (uids exists) -->
                <div v-if="saveUIDCheckbox || uids.length > 0" class="form-control animate-in fade-in slide-in-from-top-1 duration-200">
                  <label class="label pt-0">
                    <span class="label-text font-bold text-sm text-primary uppercase tracking-wider">ชื่อเล่นไอดี (สำหรับจำง่ายๆ)</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="เช่น ตัวหลัก, ไอดีไก่" 
                    class="input input-bordered w-full shadow-inner" 
                    v-model="newNameInput"
                    @keyup.enter="handleAddUID"
                  />
                </div>
              </div>

              <div v-if="saveUIDCheckbox || uids.length > 0" class="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button v-if="uids.length > 0" class="btn btn-ghost" @click="showAddInput = false, newNameInput = '', newUIDInput = ''">ยกเลิก</button>
                <button class="btn btn-primary px-10 shadow-lg shadow-primary/20" @click="handleAddUID" :disabled="!newUIDInput.trim()">
                  บันทึกไอดี
                </button>
              </div>
            </div>
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
              :disabled="isProcessing || (!selectedUID && !newUIDInput.trim()) || cooldownCounter > 0"
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
            <p v-if="!selectedUID && !newUIDInput.trim()" class="text-xs text-error font-medium animate-pulse">กรุณาเลือกหรือใส่ UID ก่อนจ้า</p>
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
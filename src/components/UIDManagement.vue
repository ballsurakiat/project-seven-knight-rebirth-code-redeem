<script setup lang="ts">
import { ref, watch } from 'vue'

interface UID {
  id: string
  name: string
}

const props = defineProps<{
  uids: UID[]
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'add', uid: string, name: string): void
  (e: 'remove', id: string): void
}>()

const newUIDInput = ref('')
const newNameInput = ref('')
const showAddInput = ref(false)
const saveUIDCheckbox = ref(false)
const lastSelectedBeforeAdd = ref('')

// Watch showAddInput to handle selection recovery
watch(showAddInput, (isShowing) => {
  if (isShowing) {
    // Store current selection before opening form
    lastSelectedBeforeAdd.value = props.modelValue
    // Clear selection so list items don't look active while typing new one
    emit('update:modelValue', '')
  } else {
    // Recover previous selection or default to last in list if cancelled
    if (!props.modelValue && props.uids.length > 0) {
      emit('update:modelValue', lastSelectedBeforeAdd.value || props.uids[props.uids.length - 1].id)
    }
  }
})

// Watch uids to ensure showAddInput is true if empty
watch(() => props.uids, (newVal) => {
  if (newVal.length === 0) {
    showAddInput.value = true
    saveUIDCheckbox.value = false
  }
}, { immediate: true })

// Sync manual input to modelValue when not in 'save' mode
watch([newUIDInput, saveUIDCheckbox, showAddInput], ([newVal, isSave, isShowing]) => {
  if (isShowing && !isSave) {
    emit('update:modelValue', newVal.trim())
  }
})

const handleAddUID = () => {
  const cleanID = newUIDInput.value.trim()
  const shouldSave = saveUIDCheckbox.value || props.uids.length > 0
  
  if (cleanID && shouldSave) {
    emit('add', cleanID, newNameInput.value.trim())
    newUIDInput.value = ''
    newNameInput.value = ''
    showAddInput.value = false
  }
}

const selectUID = (id: string) => {
  emit('update:modelValue', id)
}
</script>

<template>
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
            :class="modelValue === uid.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-base-200 border-transparent hover:border-base-300'"
          >
            <!-- Delete Button on Left -->
            <button 
              class="btn btn-circle btn-xs btn-ghost text-error hover:bg-error/20 shrink-0"
              @click.stop="emit('remove', uid.id)"
              title="ลบไอดีนี้"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div class="flex flex-col items-start leading-tight flex-1 overflow-hidden">
              <span class="text-base font-bold truncate w-full" :class="modelValue === uid.id ? 'text-primary' : ''">
                {{ uid.name || 'ไม่มีชื่อเรียก' }}
              </span>
              <span class="text-xs opacity-50 font-mono truncate w-full">{{ uid.id }}</span>
            </div>

            <!-- Selection Icon -->
            <div v-if="modelValue === uid.id" class="text-primary">
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
</template>
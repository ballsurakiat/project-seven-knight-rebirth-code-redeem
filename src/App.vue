<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUIDs } from './composables/useUIDs'
import { useRedeemer } from './composables/useRedeemer'
import { defaultCodes } from './data/defaultCodes'

// Components
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import AppAds from './components/AppAds.vue'
import OverLimitWarning from './components/OverLimitWarning.vue'
import ResultsModal from './components/ResultsModal.vue'
import UIDManagement from './components/UIDManagement.vue'
import CouponInput from './components/CouponInput.vue'

const { uids, selectedUID, addUID, removeUID, selectUID } = useUIDs()
const { results, isProcessing, redeemCodes, stopRedeeming } = useRedeemer()

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

const handleRedeem = async () => {
  if (!selectedUID.value) {
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
  await redeemCodes(selectedUID.value, codes)
  startCooldown()
}

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
      <AppHeader />

      <OverLimitWarning v-if="isOverLimit" :count="currentCodes.length" />

      <UIDManagement 
        :uids="uids" 
        :model-value="selectedUID"
        @update:model-value="selectUID" 
        @add="addUID" 
        @remove="removeUID" 
      />

      <CouponInput 
        v-model="couponInput"
        v-model:useManual="useManualCodes"
        :is-processing="isProcessing"
        :cooldown-counter="cooldownCounter"
        :can-redeem="!!selectedUID"
        :codes-count="currentCodes.length"
        @redeem="handleRedeem"
      />

      <AppAds />
    </div>

    <AppFooter />

    <ResultsModal 
      :show="showResultsModal"
      :results="results"
      :is-processing="isProcessing"
      @close="showResultsModal = false"
      @stop="stopRedeeming"
    />
  </div>
</template>
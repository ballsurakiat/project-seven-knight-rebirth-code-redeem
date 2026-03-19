import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRedeemer } from '../../src/composables/useRedeemer'
import axios from 'axios'

vi.mock('axios')

describe('useRedeemer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('should initialize with empty results', () => {
    const { results, isProcessing } = useRedeemer()
    expect(results.value).toEqual([])
    expect(isProcessing.value).toBe(false)
  })

  it('should process codes sequentially with success', async () => {
    const { results, isProcessing, redeemCodes } = useRedeemer()
    
    vi.mocked(axios.get).mockResolvedValue({ data: { msg: 'Success' } })

    const codes = ['CODE1', 'CODE2']
    const promise = redeemCodes('PID', codes)

    // Initially should be in loading state for the first one
    expect(isProcessing.value).toBe(true)
    expect(results.value[0].status).toBe('loading')
    expect(results.value[1].status).toBe('pending')

    // Fast-forward first call
    await vi.runOnlyPendingTimersAsync()
    expect(results.value[0].status).toBe('success')
    
    // Wait for the 1-second delay
    await vi.advanceTimersByTimeAsync(1000)
    
    // Fast-forward second call
    await vi.runOnlyPendingTimersAsync()
    expect(results.value[1].status).toBe('success')
    
    await promise
    expect(isProcessing.value).toBe(false)
  })

  it('should handle errors correctly', async () => {
    const { results, redeemCodes } = useRedeemer()
    
    vi.mocked(axios.get).mockRejectedValue({ response: { data: { msg: 'Already used' } } })

    await redeemCodes('PID', ['USED-CODE'])
    
    expect(results.value[0].status).toBe('error')
    expect(results.value[0].message).toBe('Already used')
  })
})

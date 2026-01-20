import { useState, useRef, useEffect } from 'react'

const OTPInput = ({ length = 6, onComplete, disabled = false }) => {
    const [otp, setOtp] = useState(new Array(length).fill(''))
    const inputRefs = useRef([])

    useEffect(() => {
        // Focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
        }
    }, [])

    const handleChange = (element, index) => {
        const value = element.value

        if (isNaN(value)) return

        // Update OTP array
        const newOtp = [...otp]
        newOtp[index] = value.slice(-1)
        setOtp(newOtp)

        // Move to next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1].focus()
        }

        // Check if complete
        const otpString = newOtp.join('')
        if (otpString.length === length && !newOtp.includes('')) {
            onComplete(otpString)
        }
    }

    const handleKeyDown = (e, index) => {
        // Move to previous input on backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, length)

        if (!/^\d+$/.test(pastedData)) return

        const newOtp = [...otp]
        pastedData.split('').forEach((char, index) => {
            if (index < length) {
                newOtp[index] = char
            }
        })
        setOtp(newOtp)

        // Focus appropriate input
        const nextIndex = Math.min(pastedData.length, length - 1)
        inputRefs.current[nextIndex].focus()

        // Check if complete
        if (pastedData.length === length) {
            onComplete(pastedData)
        }
    }

    return (
        <div className="flex gap-3 justify-center">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`
            w-12 h-14 text-center text-2xl font-bold rounded-xl
            bg-white/5 border-2 text-white
            focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${digit ? 'border-primary-500/50' : 'border-white/20'}
          `}
                />
            ))}
        </div>
    )
}

export default OTPInput

/**
 * Generate a secure 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
};

/**
 * Verify OTP matches
 * @param {string} inputOtp - OTP entered by user
 * @param {string} storedOtp - OTP stored in database
 * @returns {boolean} Whether OTPs match
 */
const verifyOTP = (inputOtp, storedOtp) => {
    return inputOtp === storedOtp;
};

module.exports = {
    generateOTP,
    verifyOTP
};

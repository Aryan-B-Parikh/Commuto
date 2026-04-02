// Email validation
export const isValidEmail = (email: string): boolean => {
    // Stricter regex for valid TLD, no consecutive dots, etc.
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && !email.includes('..');
};

// Phone validation
export const isValidPhone = (phone: string): boolean => {
    // Remove common prefixes and non-digit characters
    const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
    let target = cleaned;
    
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        target = cleaned.slice(2);
    }
    
    // Must be 10 digits starting with 6, 7, 8, or 9
    if (!/^[6-9]\d{9}$/.test(target)) return false;
    
    // Check for repetitive digits (e.g., 1111111111)
    if (new Set(target).size === 1) return false;
    
    return true;
};

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
export const isValidPassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

// OTP validation (6 digits)
export const isValidOTP = (otp: string): boolean => {
    return /^\d{6}$/.test(otp);
};

// Name validation (at least 2 characters)
export const isValidName = (name: string): boolean => {
    return name.trim().length >= 2;
};

// Date validation (not in the past)
export const isValidFutureDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
};

// Seats validation
export const isValidSeats = (seats: number): boolean => {
    return seats >= 1 && seats <= 4;
};

// Get password strength
export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    if (isValidPassword(password)) return 'strong';
    return 'medium';
};

// Form error messages
export const errorMessages = {
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    password: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    name: 'Name must be at least 2 characters',
    otp: 'Please enter a valid 6-digit OTP',
    date: 'Please select a future date',
    seats: 'Please select between 1 and 4 seats',
    required: 'This field is required',
};

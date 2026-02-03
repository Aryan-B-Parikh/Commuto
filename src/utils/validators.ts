// Email validation
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Phone validation
export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
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

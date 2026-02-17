export const Login = {
  success: {
    title: "Verification code sent! 📧",
    description: "Please check your email for the OTP",
  },
  error: {
    title: "Login failed",
    description: "Invalid email or user not found",
  },
  notFound: {
    title: "Account not found",
    description: "No account found with this email. Please sign up first.",
  },
};

export const Register = {
  success: {
    title: "Account created! 🎉",
    description: "We've sent a verification code to your email",
  },
  error: {
    title: "Registration failed",
    description: "Unable to create account. Please try again.",
  },
  emailExists: {
    title: "Email already registered",
    description: "This email is already registered. Please login instead.",
  },
};

export const Verify = {
  success: {
    title: "Email verified! ✨",
    description: "Welcome to RoomHub! You can now start exploring.",
  },
  expired: {
    title: "OTP expired",
    description: "The verification code has expired. Please request a new one.",
  },
  invalid: {
    title: "Invalid OTP",
    description: "The code you entered is incorrect. Please try again.",
  },
  resent: {
    title: "Code resent!",
    description: "A new verification code has been sent to your email",
  },
};

export const ToastStyles = {
  success: {
    background: "#10b981",
    color: "#fff",
    border: "none",
  },
  error: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
  },
  warning: {
    background: "#f59e0b",
    color: "#fff",
    border: "none",
  },
};

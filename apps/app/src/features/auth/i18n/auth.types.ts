export type AuthPage = {
  betaBanner: {
    message: string;
    contactLabel: string;
  };
  heroPanel: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
  };
  loginPage: {
    title: string;
    redirectText: string;
    redirectLabel: string;
  };
  registerPage: {
    title: string;
    redirectText: string;
    redirectLabel: string;
  };
  signInForm: {
    emailPlaceholder: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    forgotPassword: string;
    invalidEmailMessage: string;
    invalidEmailOrPassword: string;
  };
  signUpForm: {
    namePlaceholder: string;
    emailPlaceholder: string;
    usernamePlaceholder: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    invalidEmailMessage: string;
    successToast: string;
    errorToast: string;
  };
  resetPasswordPage: {
    title: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    submit: string;
    submitting: string;
    successToast: string;
    errorToast: string;
  };
  forgotPasswordCard: {
    title: string;
    description: string;
    sendLink: string;
    back: string;
    invalidEmail: string;
  };
  registerSuccessCard: {
    title: string;
    description: string;
    redirectLabel: string;
    countDownLabel: string;
    resendSuccessMessage: string;
    resendLabel: string;
    invalidEmail: string;
    resendError: string;
    messagePrefix: string;
    nextStepsTitle: string;
    steps: string[];
  };
  resetPasswordSuccessCard: {
    title: string;
    countDownLabel: string;
    resendSuccessMessage: string;
    resendLabel: string;
    invalidEmail: string;
    resendError: string;
    message: string;
  };
  formBase: {
    or: string;
    signInAriaLabel: string;
  };
  googleButton: {
    continueWithGoogle: string;
    signInError: string;
  };
  successCard: {
    resending: string;
  };
  mcpConsentPage: {
    title: string;
    description: string;
    destination: string;
    warning: string;
    approve: string;
    deny: string;
    working: string;
    error: string;
  };
};

export interface SignupFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignupFieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignupForm(values: SignupFormValues): SignupFieldErrors {
  const errors: SignupFieldErrors = {};

  if (!values.email.trim()) {
    errors.email = "Informe um email para criar sua conta.";
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Digite um email em formato valido.";
  }

  if (!values.password) {
    errors.password = "Informe uma senha.";
  } else if (values.password.length < 12) {
    errors.password = "A senha precisa ter pelo menos 12 caracteres.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirme sua senha.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "A confirmacao precisa ser igual a senha.";
  }

  return errors;
}

export function hasSignupErrors(errors: SignupFieldErrors) {
  return Object.values(errors).some(Boolean);
}

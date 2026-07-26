export interface AppUser {
  uid: string;
  email: string;
  name?: string | null;
}

export interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export const DEFAULT_SEED_USER_IMAGE =
  "https://images.unsplash.com/photo-1529419412599-7bb870e11810?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" as const;

export const DEV_DUMMY_USER = {
  id: "DUMMY_USER",
  name: "John Doe",
  email: "john_doe@gmail.com",
  password: "Dummy_user#1234",
  username: "johndoe",
  image: DEFAULT_SEED_USER_IMAGE,
} as const;

export const DEV_DUMMY_USER_ACCOUNT_ID = "DUMMY_ACCOUNT" as const;

export const DEV_DUMMY_ORG = {
  id: "org_dummy_dev_id",
  slug: "scibly-dev",
  name: "Scibly Development",
} as const;

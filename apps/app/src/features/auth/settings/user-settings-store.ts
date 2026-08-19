import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

type UserSettingsStore = {
  name: string;
  setName: (name: string) => void;

  username: string | null;
  setUsername: (username: string | null) => void;

  avatarUrl: string | null;
  setAvatarUrl: (avatarUrl: string | null) => void;

  emailNotifications: boolean;
  setEmailNotifications: (emailNotifications: boolean) => void;

  marketingNotifications: boolean;
  setMarketingNotifications: (marketingNotifications: boolean) => void;

  initUserSettingsStore: ({
    name,
    username,
    avatarUrl,
    emailNotifications,
    marketingNotifications,
  }: {
    name: UserSettingsStore["name"];
    username: UserSettingsStore["username"];
    avatarUrl: UserSettingsStore["avatarUrl"];
    emailNotifications: UserSettingsStore["emailNotifications"];
    marketingNotifications: UserSettingsStore["marketingNotifications"];
  }) => void;
};

export const useUserSettingsStore = createWithEqualityFn<UserSettingsStore>()(
  (set) => ({
    name: "",
    setName: (name) => set({ name }),

    username: "",
    setUsername: (username) => set({ username }),

    avatarUrl: "",
    setAvatarUrl: (avatarUrl) => set({ avatarUrl }),

    emailNotifications: false,
    setEmailNotifications: (emailNotifications) => set({ emailNotifications }),

    marketingNotifications: false,
    setMarketingNotifications: (marketingNotifications) =>
      set({ marketingNotifications }),

    initUserSettingsStore: (data) => {
      set(data);
    },
  }),
  shallow,
);

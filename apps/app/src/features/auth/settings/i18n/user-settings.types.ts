export type UserSettingsPage = {
  title: string;
  subtitle: string;
  saveChanges: string;
  savedSuccessfully: string;
  name: {
    title: string;
    description: string;
    footer: string;
  };
  username: {
    title: string;
    description: string;
    footer: string;
    taken: string;
  };
  avatar: {
    title: string;
    description: string;
    footer: string;
    uploadText: string;
  };
  emailNotifications: {
    title: string;
    description: string;
    footer: string;
  };
  marketingNotifications: {
    title: string;
    description: string;
    footer: string;
  };
  deleteAccount: {
    title: string;
    description: string;
    button: string;
    modal: {
      title: string;
      warning: string;
      label1: string;
      label2: string;
      confirmText: string;
      deleteButton: string;
    };
  };
};

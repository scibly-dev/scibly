type NavUseCaseItem = {
  label: string;
  slug: string;
};

export type HomePage = {
  metadata: {
    title: string;
    description: string;
  };
  navbar: {
    home: string;
    blog: string;
    solutions: string;
    allUseCases: string;
    useCases: NavUseCaseItem[];
    aiSkills: string;
    signIn: string;
    createAccount: string;
    github: string;
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
  };
  footer: {
    brand: string;
    glossary: string;
    impressum: string;
    privacy: string;
    copyright: string;
  };
};

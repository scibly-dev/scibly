export type KnowledgeTranslations = {
  title: string;
  subtitle: string;
  newTopic: string;
  empty: {
    title: string;
    description: string;
  };
  gate: {
    lockedTitle: string;
    lockedDescription: string;
    lapsedTitle: string;
    lapsedDescription: string;
    fallbackPlan: string;
  };
  health: {
    lastSync: string;
    never: string;
    pendingSuggestions: string;
  };
  card: {
    repositories: string;
    maintainers: string;
    noMaintainers: string;
    language: string;
    edit: string;
    delete: string;
  };
  form: {
    createTitle: string;
    editTitle: string;
    description: string;
    optional: string;
    name: string;
    namePlaceholder: string;
    nameRequired: string;
    language: string;
    languageEn: string;
    languageDe: string;
    repositories: string;
    repositoriesHint: string;
    repositoriesSelect: string;
    repositoriesRequired: string;
    repositoriesLoading: string;
    repositoriesEmpty: string;
    repositoriesUnreachable: string;
    maintainers: string;
    maintainersHint: string;
    maintainersSelect: string;
    maintainersEmpty: string;
    foldersBrowse: string;
    foldersLoading: string;
    foldersEmpty: string;
    pathsPlaceholder: string;
    pathsInvalid: string;
    add: string;
    filterPlaceholder: string;
    noMatches: string;
    selected: string;
    cancel: string;
    save: string;
    saving: string;
    created: string;
    updated: string;
  };
  deleteDialog: {
    title: string;
    description: string;
    confirm: string;
    cancel: string;
    deleted: string;
  };
};

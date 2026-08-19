export interface PlayerStateTranslations {
  playerStates: {
    locked: {
      title: string;
      description: string;
      time: string;
      times: string;
    };
    readOnly: {
      title: string;
      description: string;
    };
    courseUnavailable: {
      notPublishedTitle: string;
      notPublishedDescription: string;
      notAvailableTitle: string;
      notAvailableDescription: string;
      loadFailedTitle: string;
      loadFailedDescription: string;
      retry: string;
    };
    retryConfirm: {
      title: string;
      description: string;
      confirmCta: string;
      confirmCtaPending: string;
      backToDashboard: string;
    };
    versionUpdateConfirm: {
      title: string;
      description: string;
      confirmCta: string;
      confirmCtaPending: string;
      backToDashboard: string;
    };
  };
}

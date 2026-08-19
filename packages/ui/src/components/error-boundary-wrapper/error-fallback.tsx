type ErrorFallbackProps = {
  error: Error;
  resetErrorBoundary: () => void;
  title?: string;
  retryLabel?: string;
};

export const ErrorFallback = ({
  error,
  resetErrorBoundary,
  title = "Etwas ist schief gelaufen",
  retryLabel = "Nochmal versuchen",
}: ErrorFallbackProps) => {
  return (
    <div className="m-auto flex rounded-md bg-red-50 p-8">
      <div className="flex w-full max-w-2xl items-start justify-center">
        <div className="shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1 overflow-hidden">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 max-h-32 overflow-y-auto">
            <p className="wrap-break-word text-sm text-red-700">{error.message}</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={resetErrorBoundary}
              className="rounded-md bg-red-100 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              {retryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

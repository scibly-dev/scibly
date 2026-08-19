import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  wrapperClassName?: string;
};

export function LoadingState({ wrapperClassName }: LoadingStateProps) {
  return (
    <div
      className={
        wrapperClassName ||
        "mx-auto mt-14 mb-96 flex w-[80vw] max-w-[1000px] flex-col md:mt-20 md:w-[70vw] md:items-center md:justify-center xl:w-[53vw]"
      }
    >
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400/80 dark:text-neutral-500/80" />
      </div>
    </div>
  );
}

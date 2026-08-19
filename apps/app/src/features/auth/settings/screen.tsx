import { getSession } from "@scibly/auth/session";
import { type Locale } from "@scibly/i18n/constants";
import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

import { getFullDictionary } from "@/i18n/dictionaries";

import { UserSettingsForm } from "./components/user-settings-form";

export async function UserSettingsScreen({ locale }: { locale: Locale }) {
  const [dict, session] = await Promise.all([
    getFullDictionary(locale),
    getSession(),
  ]);
  const t = dict.userSettings;

  if (!session?.user) {
    return redirect(routes.app.auth.default);
  }

  return (
    <div className="flex w-full flex-col gap-8 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {t.subtitle}
        </p>
      </div>
      <UserSettingsForm t={t} session={session} />
    </div>
  );
}

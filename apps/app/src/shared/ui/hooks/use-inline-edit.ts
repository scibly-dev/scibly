import { useState } from "react";

export function useInlineEdit<T extends string | number>({
  onSave,
}: {
  onSave: (value: T) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  // SAFETY: nothing reads this seed. The field only renders while `isEditing`,

  const [value, setValue] = useState<T>("" as T);

  const start = (initial: T) => {
    setValue(initial);
    setIsEditing(true);
  };

  const cancel = () => setIsEditing(false);

  const save = () => {
    setIsEditing(false);
    onSave(value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") save();
    else if (e.key === "Escape") cancel();
  };

  return { isEditing, value, setValue, start, save, cancel, onKeyDown };
}

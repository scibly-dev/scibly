import { getInitials } from "@scibly/lib";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@scibly/ui/components/avatar";

interface CourseEnrollmentUserAvatarProps {
  name: string | null;
  email: string;
  image: string | null;
}

export function CourseEnrollmentUserAvatar({
  name,
  email,
  image,
}: CourseEnrollmentUserAvatarProps) {
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={image ?? ""} />
      <AvatarFallback className="bg-ground text-ink border-edge border text-[11px] font-semibold">
        {name ? getInitials(name) : email[0].toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

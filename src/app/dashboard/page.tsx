import { redirect } from "next/navigation";

import { authOptions, getAuthSession } from "@/lib/auth";
import { UserNameForm } from "@/components/UserNameForm";
import { db } from "@/lib/db";

export const metadata = {
  title: "Dashboard",
  description: "Manage account and website settings.",
};

export default async function SettingsPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(authOptions?.pages?.signIn || "/login");
  }

  // getting about from db and passing it to UserNameForm

  const about = await db.user.findFirst({
    where: {
      id: session.user.id,
    },
    select: {
      about: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto ">
      <div className="grid items-start gap-2">
        <div className="grid ">
          <UserNameForm
            user={{
              id: session.user.id,
              username: session?.user.username || "",
              image: session?.user.image || "",
              about: about?.about || "",
            }}
          />
        </div>
      </div>
    </div>
  );
}

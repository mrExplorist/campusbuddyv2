// import SignIn from "@/components/SignIn";

import SignIn from "@/components/Auth/SignIn";

import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

const page: FC = () => {
  return (
    <div className="absolute inset-0">
      <div className="h-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-20">
        <Link href="/" className={cn("flex self-start -mt-20 text-gray-400")}>
          <ChevronLeft className="mr-2 h-4 w-4 text-blue-500" />
          Home
        </Link>

        <SignIn />
      </div>
    </div>
  );
};

export default page;

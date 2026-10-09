import { useEffect } from "react";
import { Toaster, toast } from "maplewood-year-round";

export const Success = () => {
  useEffect(() => {
    toast("You are on the list", {
      description: "Registration dates arrive in your inbox first.",
      duration: 60000,
    });
  }, []);
  return (
    <div className="h-[240px] bg-background">
      <Toaster position="top-center" />
    </div>
  );
};

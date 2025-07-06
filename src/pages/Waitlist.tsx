import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import WaitlistForm from "@/components/auth/WaitlistForm";

const Waitlist = () => {
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState<"developer" | "expert">("developer");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const type = searchParams.get("type") as "developer" | "expert";
    const emailParam = searchParams.get("email") || "";
    const nameParam = searchParams.get("name") || "";

    if (type && (type === "developer" || type === "expert")) {
      setUserType(type);
    }
    setEmail(emailParam);
    setFullName(nameParam);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading gradient-text">
            Lista de Espera
          </h1>
          <p className="text-muted-foreground mt-2">
            Te notificaremos cuando esté listo
          </p>
        </div>
        
        <WaitlistForm 
          userType={userType}
          email={email}
          fullName={fullName}
        />
      </div>
    </div>
  );
};

export default Waitlist;
import { LoginPage } from "@/components/LoginPage";
import { getUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";

export default async function Login() {
  const user = await getUser();

  if (user) {
    redirect("/");
  }

  return <LoginPage />;
}

import type { Route } from "./+types/home";
import MainCard, { UtxoList, DepositAddressList } from "../welcome/welcome";
import { Providers } from "@/provider";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isConnected } = useAppKitAccount();
  const { open, close } = useAppKit();
  return (
    <div className="flex gap-4 items-center justify-center w-full">
      <Providers>
        {isConnected ? (
          <MainCard />
        ) : (
          <div className="h-full flex justify-center items-center">
            <Button onClick={open} className="w-full">
              Connect Wallet
            </Button>
          </div>
        )}
      </Providers>
    </div>
  );
}

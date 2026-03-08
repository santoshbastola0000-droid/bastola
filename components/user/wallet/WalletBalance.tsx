import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { WalletBalanceType } from "@/types/wallet.types";
import { Wallet, TrendingUp, Clock, IndianRupee } from "lucide-react";

interface Props {
  balance: WalletBalanceType;
}

export function WalletBalance({ balance }: Props) {
  const cards = [
    {
      title: "Available Balance",
      value: balance.balance,
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Ready to withdraw",
    },
    {
      title: "Pending Balance",
      value: balance.pendingBalance,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "Under process",
    },
    {
      title: "Total Earned",
      value: balance.totalEarned,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Lifetime earnings",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <h3 className="text-2xl font-bold mt-2 flex items-center gap-1">
                  <IndianRupee className="h-5 w-5" />
                  {formatCurrency(card.value)}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  {card.description}
                </p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

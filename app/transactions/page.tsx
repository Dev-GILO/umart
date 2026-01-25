'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  FileText,
  MessageCircle,
  Shield,
} from 'lucide-react';
import { useTransactions, Transaction } from '@/hooks/useTransactions';

// Map API status to display status
type DisplayStatus = 'pending' | 'paid' | 'shipped' | 'received' | 'completed' | 'disputed';

const statusConfig: Record<DisplayStatus, {
  label: string;
  color: string;
  icon: React.ForwardRefExoticComponent<any>;
  description: string;
}> = {
  pending: {
    label: 'Pending Payment',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    icon: Clock,
    description: 'Waiting for payment to be made',
  },
  paid: {
    label: 'Payment Confirmed',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    icon: CheckCircle,
    description: 'Payment is in escrow, seller will ship soon',
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
    icon: Package,
    description: 'Item is on its way to you',
  },
  received: {
    label: 'Received',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    icon: CheckCircle,
    description: 'Confirm receipt and condition to release payment',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    icon: CheckCircle,
    description: 'Transaction completed successfully',
  },
  disputed: {
    label: 'Disputed',
    color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    icon: AlertCircle,
    description: 'Dispute in progress',
  },
};

// Map API transaction status to display status
function mapTransactionStatus(transaction: Transaction): DisplayStatus {
  if (transaction.status === 'successful' && transaction.valueConfirmed) {
    return 'completed';
  }
  if (transaction.status === 'successful' && !transaction.valueConfirmed) {
    return 'received';
  }
  if (transaction.status === 'pending') {
    return 'pending';
  }
  if (transaction.status === 'failed') {
    return 'disputed';
  }
  if (transaction.status === 'cancelled') {
    return 'disputed';
  }
  return 'paid';
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<DisplayStatus | 'all'>('all');
  const { transactions, loading, error } = useTransactions();

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => mapTransactionStatus(t) === filter);

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Transactions</h1>
            <p className="text-muted-foreground">
              Manage your purchases and track order status
            </p>
          </div>

          {/* Filter */}
          <div className="mb-8">
            <Select value={filter} onValueChange={(value: string) => setFilter(value as DisplayStatus | 'all')}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="pending">Pending Payment</SelectItem>
                <SelectItem value="paid">Payment Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions List */}
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Loading transactions...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-red-600">{error}</p>
                </CardContent>
              </Card>
            ) : filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground mb-4">
                    No transactions found
                  </p>
                  <Button asChild>
                    <Link href="/browse">Start Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : filteredTransactions.map((transaction) => {
              const displayStatus = mapTransactionStatus(transaction);
              const config = statusConfig[displayStatus];
              const IconComponent = config.icon;

              return (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                      {/* Product Info */}
                      <div className="md:col-span-2 flex gap-4">
                        <div className="w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                          <img
                            src={transaction.product?.image || "/placeholder.svg"}
                            alt={transaction.product?.title || "Product"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {transaction.product?.title || 'Product'}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Seller: {transaction.seller?.username || transaction.seller?.fullName || 'Unknown'}
                          </p>
                          <Badge variant="secondary">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col items-start md:items-end">
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className="h-5 w-5" />
                          <Badge className={config.color}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground text-right">
                          {config.description}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Ref: {transaction.referenceId.slice(0, 8)}...
                        </p>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex flex-col items-start md:items-end justify-between">
                        <p className="text-2xl font-bold text-primary mb-4">
                          ₦{transaction.amount.toFixed(2)}
                        </p>
                        <div className="flex gap-2 w-full md:flex-col-reverse">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                          >
                            <Link href={`/chat?seller=${transaction.seller?.username || transaction.sellerId}`}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message
                            </Link>
                          </Button>
                          {displayStatus === 'received' && !transaction.valueConfirmed && (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm Receipt
                            </Button>
                          )}
                          {displayStatus === 'pending' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                            >
                              Complete Payment
                            </Button>
                          )}
                          {displayStatus === 'disputed' && (
                            <Button
                              asChild
                              variant="default"
                              size="sm"
                              className="flex-1"
                            >
                              <Link href={`/disputes/${transaction.id}`}>
                                View Dispute
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Escrow Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your funds are held safely until you confirm receipt and condition of items.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor every step of your shipment from seller to your doorstep.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Contact our support team 24/7 for any issues or questions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
'use client';

import React from "react"

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Zap,
  Check,
  ArrowRight,
  Upload,
  FileText,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { PayWithPaystack } from '@/components/payment/pay-with-paystack';

interface UpgradeStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

const sellerBenefits = [
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Higher Visibility',
    description: 'Premium seller badge and featured listings',
  },
  {
    icon: <ShoppingBag className="h-6 w-6" />,
    title: 'Bulk Selling',
    description: 'List unlimited products and categories',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Customer Support',
    description: 'Dedicated account manager',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Tools & Analytics',
    description: 'Seller dashboard with detailed insights',
  },
];

const steps: UpgradeStep[] = [
  {
    id: 1,
    title: 'Business Information',
    description: 'Tell us about your business',
    icon: <FileText className="h-6 w-6" />,
    completed: false,
  },
  {
    id: 2,
    title: 'Verification',
    description: 'Verify your identity and business',
    icon: <Check className="h-6 w-6" />,
    completed: false,
  },
  {
    id: 3,
    title: 'Payment Setup',
    description: 'Configure your payout method',
    icon: <ShoppingBag className="h-6 w-6" />,
    completed: false,
  },
];

const SELLER_UPGRADE_FEE = 9900; // ₦9,900

export default function SellerUpgradePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'individual',
    description: '',
    phoneNumber: '',
    businessAddress: '',
    idDocument: null as File | null,
    businessLicense: null as File | null,
    paymentMethod: 'bank_transfer',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 1 && !formData.businessName) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (currentStep === 3) {
      setShowPayment(true);
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge className="mb-4 inline-block">Become a Premium Seller</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Unlock Your Selling Potential
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our network of successful sellers and reach thousands of verified buyers.
              Upgrade to Premium for enhanced tools and support.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {sellerBenefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="text-primary mb-4">{benefit.icon}</div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Steps */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Upgrade Steps</CardTitle>
                  <CardDescription>
                    Complete these steps to become a premium seller
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={`w-full text-left p-4 rounded-lg transition-colors ${
                          currentStep === step.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary text-foreground'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                              step.completed
                                ? 'bg-green-500 text-white'
                                : currentStep === step.id
                                ? 'bg-primary-foreground text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {step.completed ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              step.id
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{step.title}</p>
                            <p
                              className={`text-xs ${
                                currentStep === step.id
                                  ? 'opacity-90'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-2">
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Step 1: Business Information</CardTitle>
                    <CardDescription>
                      Tell us about your business to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="businessName" className="text-sm font-medium text-foreground mb-2 block">
                          Business Name
                        </label>
                        <Input
                          id="businessName"
                          name="businessName"
                          placeholder="Your business name"
                          value={formData.businessName}
                          onChange={handleFormChange}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="businessType" className="text-sm font-medium text-foreground mb-2 block">
                          Business Type
                        </label>
                        <select
                          id="businessType"
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleFormChange}
                          required
                          className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                        >
                          <option value="">Select business type</option>
                          <option value="individual">Individual Seller</option>
                          <option value="retail">Retail Store</option>
                          <option value="wholesale">Wholesaler</option>
                          <option value="manufacturer">Manufacturer</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="description" className="text-sm font-medium text-foreground mb-2 block">
                          Business Description
                        </label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Tell us about your products and services..."
                          value={formData.description}
                          onChange={handleFormChange}
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="phoneNumber" className="text-sm font-medium text-foreground mb-2 block">
                          Phone Number
                        </label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phoneNumber}
                          onChange={handleFormChange}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="businessAddress" className="text-sm font-medium text-foreground mb-2 block">
                          Business Address
                        </label>
                        <Textarea
                          id="businessAddress"
                          name="businessAddress"
                          placeholder="Street address, city, state, zip"
                          value={formData.businessAddress}
                          onChange={handleFormChange}
                          rows={3}
                          required
                        />
                      </div>

                      <Button
                        onClick={() => setCurrentStep(2)}
                        className="w-full"
                      >
                        Continue to Verification
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Step 2: Verification</CardTitle>
                    <CardDescription>
                      Verify your identity to become a trusted seller
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-semibold text-foreground mb-2">
                        Upload ID Document
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a photo of your government-issued ID
                      </p>
                      <Button variant="outline" className="w-full bg-transparent">
                        Choose File
                      </Button>
                    </div>

                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-semibold text-foreground mb-2">
                        Business License (Optional)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload your business license for faster approval
                      </p>
                      <Button variant="outline" className="w-full bg-transparent">
                        Choose File
                      </Button>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-primary/50 rounded-lg p-4">
                      <p className="text-sm text-foreground">
                        Your documents are encrypted and secure. We verify them within 24 hours.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(3)}
                        className="flex-1"
                      >
                        Continue to Payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Step 3: Payment Setup</CardTitle>
                    <CardDescription>
                      Configure how you'll receive your earnings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!showPayment ? (
                      <>
                        <div className="space-y-4">
                          <label className="block">
                            <div className={`border border-border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors ${formData.paymentMethod === 'bank_transfer' ? 'ring-2 ring-primary' : ''}`}>
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="bank_transfer"
                                  checked={formData.paymentMethod === 'bank_transfer'}
                                  onChange={handleFormChange}
                                  className="w-4 h-4"
                                />
                                <div>
                                  <h4 className="font-semibold text-foreground mb-1">
                                    Bank Account
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Direct deposit to your bank account
                                  </p>
                                </div>
                              </div>
                            </div>
                          </label>

                          {formData.paymentMethod === 'bank_transfer' && (
                            <div className="bg-muted p-4 rounded-lg space-y-4 border border-border">
                              <Input
                                placeholder="Bank Name"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleFormChange}
                                required
                              />
                              <Input
                                placeholder="Account Number"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleFormChange}
                                required
                              />
                              <Input
                                placeholder="Account Holder Name"
                                name="accountHolder"
                                value={formData.accountHolder}
                                onChange={handleFormChange}
                                required
                              />
                            </div>
                          )}

                          <label className="block">
                            <div className={`border border-border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors ${formData.paymentMethod === 'paypal' ? 'ring-2 ring-primary' : ''}`}>
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="paypal"
                                  checked={formData.paymentMethod === 'paypal'}
                                  onChange={handleFormChange}
                                  className="w-4 h-4"
                                />
                                <div>
                                  <h4 className="font-semibold text-foreground mb-1">
                                    PayPal
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Transfer funds to your PayPal account
                                  </p>
                                </div>
                              </div>
                            </div>
                          </label>

                          <label className="block">
                            <div className={`border border-border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors ${formData.paymentMethod === 'check' ? 'ring-2 ring-primary' : ''}`}>
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="check"
                                  checked={formData.paymentMethod === 'check'}
                                  onChange={handleFormChange}
                                  className="w-4 h-4"
                                />
                                <div>
                                  <h4 className="font-semibold text-foreground mb-1">
                                    Check
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Receive payments by check
                                  </p>
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>

                        <Card className="bg-blue-50 dark:bg-blue-950 border border-primary/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">
                                  Seller Upgrade Fee
                                </h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Complete your seller verification and pay the upgrade fee to get started.
                                </p>
                                <p className="font-bold text-lg">
                                  Fee: ₦{SELLER_UPGRADE_FEE.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep(2)}
                            className="flex-1"
                          >
                            Back
                          </Button>
                          <Button 
                            onClick={handleSubmit}
                            className="flex-1"
                          >
                            Pay Now
                            <CreditCard className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <PayWithPaystack 
                          amount={SELLER_UPGRADE_FEE} 
                          reference={`seller-upgrade-${Date.now()}`}
                          onSuccess={() => {
                            setIsDialogOpen(true);
                          }}
                          onClose={() => setShowPayment(false)}
                        />
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Upgrade Complete!</DialogTitle>
                              <DialogDescription>
                                You're now a premium seller
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-center py-6">
                                <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-foreground mb-2">
                                  Welcome to SecureEscrow Premium!
                                </h3>
                                <p className="text-muted-foreground">
                                  Your seller account has been upgraded with premium features.
                                </p>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  <span className="text-foreground">
                                    Premium seller badge enabled
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  <span className="text-foreground">
                                    Seller dashboard access granted
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  <span className="text-foreground">
                                    Enhanced listing visibility
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  <span className="text-foreground">
                                    Dedicated support access
                                  </span>
                                </div>
                              </div>

                              <Button
                                asChild
                                className="w-full"
                                onClick={() => setIsDialogOpen(false)}
                              >
                                <Link href="/">Go to Dashboard</Link>
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* FAQ Section */}
          <Card className="bg-secondary">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  What does Premium Seller include?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Premium sellers get a special badge, featured listing placement, seller dashboard with analytics,
                  and access to our dedicated seller support team.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  What are the fees?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Premium sellers pay a 3% transaction fee instead of 5% for regular sellers. Listing is free.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  How long does verification take?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Most sellers are verified within 24 hours of submitting their documents. Complex cases may take longer.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

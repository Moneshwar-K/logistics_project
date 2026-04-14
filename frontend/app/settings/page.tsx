'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Building2, Zap, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  return (
    <MainLayout title="Settings">
      <div className="max-w-4xl">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="bg-secondary/20 border-b border-border rounded-none">
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Zap className="w-4 h-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-6">
            <Card className="border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">Company Profile</h3>

              {saveStatus === 'success' && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-500 text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Settings saved successfully
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="text-foreground mb-2 block">Company Name</Label>
                  <Input
                    type="text"
                    placeholder="LogisticHub India Pvt Ltd"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Email</Label>
                  <Input
                    type="email"
                    placeholder="company@logistichub.com"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Address</Label>
                  <Input
                    type="text"
                    placeholder="Company Address"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button onClick={handleSave} disabled={saveStatus === 'saving'} className="bg-primary hover:bg-primary/90">
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Features Settings */}
          <TabsContent value="features" className="space-y-6">
            <Card className="border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">Feature Management</h3>
              <p className="text-muted-foreground text-sm mb-4">Configure which features are available for your operations.</p>

              <div className="space-y-4">
                {[
                  { label: 'Real-time Tracking', enabled: true },
                  { label: 'Auto POD Verification', enabled: true },
                  { label: 'Advanced Audit Reports', enabled: true },
                  { label: 'Billing Integration', enabled: false },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/10 transition-colors"
                  >
                    <div>
                      <p className="text-foreground font-medium">{feature.label}</p>
                    </div>
                    <div
                      className={`w-12 h-6 rounded-full transition-colors ${feature.enabled ? 'bg-green-500/20 border border-green-500' : 'bg-slate-500/20 border border-slate-500'}`}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">Security Settings</h3>

              <div className="space-y-6">
                <div>
                  <Label className="text-foreground mb-2 block font-semibold">Change Password</Label>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Current Password"
                      className="bg-input border-border text-foreground"
                    />
                    <Input
                      type="password"
                      placeholder="New Password"
                      className="bg-input border-border text-foreground"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      className="bg-input border-border text-foreground"
                    />
                    <Button className="bg-primary hover:bg-primary/90">Update Password</Button>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground mt-1">Enable 2FA for enhanced security</p>
                        <Button size="sm" variant="outline" className="mt-3 border-border text-foreground hover:bg-secondary/20 bg-transparent">
                          Enable 2FA
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

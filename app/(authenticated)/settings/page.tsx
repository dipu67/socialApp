'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {useTheme} from 'next-themes'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  LogOut,
  Eye,
  Lock,
  Mail,
  Smartphone,
  Globe,
  Moon,
  Sun
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function SettingsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('account');
    const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    // Account Settings
    email: session?.user?.email || '',
    phone: '',
    twoFactorEnabled: false,
    
    // Privacy Settings
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessages: true,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    likeNotifications: true,
    followNotifications: true,
    
    // Appearance Settings
    language: 'en',
    timezone: 'UTC-8'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const settingsSections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <section.icon className="h-4 w-4 mr-3" />
                    {section.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Account Settings */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={session?.user?.image || `https://avatar.vercel.sh/${session?.user?.email}`} />
                      <AvatarFallback className="text-xl">
                        {session?.user?.name ? getInitials(session.user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{session?.user?.name || 'User'}</h3>
                      <p className="text-sm text-gray-500">{session?.user?.email}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Change Photo
                      </Button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Address
                    </label>
                    <Input
                      value={settings.email}
                      onChange={(e) => updateSetting('email', e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Phone Number
                    </label>
                    <Input
                      value={settings.phone}
                      onChange={(e) => updateSetting('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Two Factor Authentication */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.twoFactorEnabled}
                      onCheckedChange={(checked: boolean) => updateSetting('twoFactorEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Privacy & Security Settings */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Visibility */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Profile Visibility
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="visibility"
                          value="public"
                          checked={settings.profileVisibility === 'public'}
                          onChange={(e) => updateSetting('profileVisibility', e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Public - Anyone can see your profile</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="visibility"
                          value="private"
                          checked={settings.profileVisibility === 'private'}
                          onChange={(e) => updateSetting('profileVisibility', e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Private - Only followers can see your profile</span>
                      </label>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Contact Information Visibility</h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show email address</span>
                      <Switch
                        checked={settings.showEmail}
                        onCheckedChange={(checked: boolean) => updateSetting('showEmail', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show phone number</span>
                      <Switch
                        checked={settings.showPhone}
                        onCheckedChange={(checked: boolean) => updateSetting('showPhone', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Allow direct messages</span>
                      <Switch
                        checked={settings.allowMessages}
                        onCheckedChange={(checked: boolean) => updateSetting('allowMessages', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked: boolean) => updateSetting('emailNotifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-500">Receive push notifications</p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked: boolean) => updateSetting('pushNotifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Messages</p>
                        <p className="text-sm text-gray-500">Get notified of new messages</p>
                      </div>
                      <Switch
                        checked={settings.messageNotifications}
                        onCheckedChange={(checked: boolean) => updateSetting('messageNotifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Likes & Comments</p>
                        <p className="text-sm text-gray-500">Get notified when someone likes or comments</p>
                      </div>
                      <Switch
                        checked={settings.likeNotifications}
                        onCheckedChange={(checked: boolean) => updateSetting('likeNotifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Followers</p>
                        <p className="text-sm text-gray-500">Get notified of new followers</p>
                      </div>
                      <Switch
                        checked={settings.followNotifications}
                        onCheckedChange={(checked: boolean) => updateSetting('followNotifications', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Appearance Settings */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance & Localization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Palette className="h-5 w-5" />
                      <h3 className="font-medium">Theme</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {/* Light Theme */}
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          theme === 'light' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setTheme('light')}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Sun className="h-6 w-6" />
                          <span className="text-sm font-medium">Light</span>
                          <div className="w-full h-3 bg-white border border-gray-200 rounded"></div>
                        </div>
                      </div>

                      {/* Dark Theme */}
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          theme === 'dark' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setTheme('dark')}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Moon className="h-6 w-6" />
                          <span className="text-sm font-medium">Dark</span>
                          <div className="w-full h-3 bg-gray-800 border border-gray-600 rounded"></div>
                        </div>
                      </div>

                      {/* System Theme */}
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          theme === 'system' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setTheme('system')}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Settings className="h-6 w-6" />
                          <span className="text-sm font-medium">System</span>
                          <div className="w-full h-3 bg-gradient-to-r from-white via-gray-400 to-gray-800 border border-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      Current theme: <span className="font-medium capitalize">{theme}</span>
                      {theme === 'system' && (
                        <span className="ml-1">(follows your system preference)</span>
                      )}
                    </p>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >

                      <option value="UTC-6">Dhaka Time (GMT+6)</option>
                      <option value="UTC-8">Pacific Time (GMT-8)</option>
                      <option value="UTC-5">Eastern Time (GMT-5)</option>
                      <option value="UTC+0">Greenwich Mean Time (GMT+0)</option>
                      <option value="UTC+1">Central European Time (GMT+1)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Sign Out</h4>
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                  Sign out of your account on this device.
                </p>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
              
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Delete Account</h4>
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function SettingsPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 max-w-md"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4 max-w-xs"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageLoading />}>
      <SettingsPageContent />
    </Suspense>
  );
}
